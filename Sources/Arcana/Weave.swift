import Foundation

// ===================================================================
//  Weave — one quiet synthesis of a completed spread. The model sees
//  only Arcana's authored card language and the positions in the spread.
// ===================================================================

struct WeaveResult: Codable, Equatable {
  let thread: String
  let question: String
}

@MainActor
final class WeaveService {
  static let shared = WeaveService()

  enum Failure: Error {
    case missingKey
    /// OpenAI will not take the key: it is not offered again.
    case refused
    case request
    case response
    case invalidResult
  }

  /// OpenAI's API; a test points it elsewhere.
  static var api = URL(string: "https://api.openai.com/v1")!
  private static var model: String { ProcessInfo.processInfo.environment["ARCANA_AI_MODEL"] ?? "gpt-5" }

  /// There is a key to ask with, and OpenAI has not refused it. Without one
  /// the thread is not offered at all, rather than offered and always quiet.
  static var ready: Bool { APIKeyStore.value().map(OpenAIKey.usable) ?? false }

  /// Whether OpenAI will take this key for the thread. It is asked for the
  /// model the thread is written by, which costs nothing and sends nothing
  /// but the key. Nil when the answer says neither.
  static func check(_ key: String) async -> OpenAIKey.Verdict? {
    var request = URLRequest(url: api.appendingPathComponent("models").appendingPathComponent(model))
    request.timeoutInterval = 15
    request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
    let verdict: OpenAIKey.Verdict?
    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let http = response as? HTTPURLResponse else { return nil }
      verdict = said(http.statusCode, data, thread: false)
    } catch {
      if Task.isCancelled { return nil }
      verdict = .unreachable
    }
    if let verdict { OpenAIKey.heard(verdict, of: key) }
    return verdict
  }

  /// What an answer from OpenAI says of the key it was asked with, if it
  /// says anything: a wrong key, a model out of its reach, no credit left.
  /// A key barred from writing the thread is refused only when the thread
  /// itself is asked for — a key may be barred from reading the models and
  /// still write.
  private static func said(_ status: Int, _ data: Data, thread: Bool) -> OpenAIKey.Verdict? {
    let error = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? [String: Any]
    let code = error?["code"] as? String ?? error?["type"] as? String
    switch status {
    case 200..<300: return .ready
    case 401: return .refused
    case 403: return thread ? .refused : nil
    case 404 where code == "model_not_found": return .refused
    case 429 where code == "insufficient_quota": return .noCredit
    default: return nil
    }
  }

  // The reader's written question is never part of this request.
  func make(spread: Spread, draws: [Draw]) async throws -> WeaveResult {
    guard let key = APIKeyStore.value() else { throw Failure.missingKey }

    let payload: [String: Any] = [
      "model": Self.model,
      "store": false,
      "input": [
        [
          "role": "developer",
          "content": [[
            "type": "input_text",
            "text": """
            You are the hidden editorial voice inside Arcana, a quiet tarot reading room.
            Return only the requested JSON object. Write with restraint: precise, literary,
            humane, and concrete. Never mention AI, models, prompts, tarot stereotypes,
            prediction, fate, or certainty. Do not invent card meanings or facts. Use the
            supplied card language as the source of truth, and treat the spread positions
            as relationships rather than a list of summaries.

            `thread` must be exactly two short sentences connecting the spread's movement,
            tension, or resolution. `question` must be exactly one short reflective question
            that gives the reader agency. Avoid advice, diagnosis, reassurance, and claims
            about another person's thoughts or future events.
            """
          ]]
        ],
        [
          "role": "user",
          "content": [[
            "type": "input_text",
            "text": Self.prompt(spread: spread, draws: draws)
          ]]
        ]
      ],
      "text": [
        "format": [
          "type": "json_schema",
          "name": "arcana_weave",
          "strict": true,
          "schema": [
            "type": "object",
            "additionalProperties": false,
            "properties": [
              "thread": ["type": "string"],
              "question": ["type": "string"]
            ],
            "required": ["thread", "question"]
          ]
        ]
      ]
    ]

    var request = URLRequest(url: Self.api.appendingPathComponent("responses"))
    request.httpMethod = "POST"
    request.timeoutInterval = 45
    request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let data: Data
    let response: URLResponse
    do {
      (data, response) = try await URLSession.shared.data(for: request)
    } catch is CancellationError {
      throw CancellationError()
    } catch {
      throw Failure.request
    }

    guard let http = response as? HTTPURLResponse else { throw Failure.request }
    guard (200..<300).contains(http.statusCode) else {
      // a key OpenAI will not take, or that has no credit left, is heard,
      // and the thread is not offered with it again
      if let verdict = Self.said(http.statusCode, data, thread: true) {
        OpenAIKey.heard(verdict, of: key)
        throw Failure.refused
      }
      throw Failure.request
    }

    guard let object = try? JSONSerialization.jsonObject(with: data),
      let text = Self.outputText(from: object),
      let resultData = text.data(using: .utf8),
      let result = try? JSONDecoder().decode(WeaveResult.self, from: resultData)
    else {
      throw Failure.response
    }

    let thread = result.thread.trimmingCharacters(in: .whitespacesAndNewlines)
    let question = result.question.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !thread.isEmpty, !question.isEmpty, thread.count <= 600, question.count <= 220 else {
      throw Failure.invalidResult
    }

    OpenAIKey.worked(key)
    return WeaveResult(thread: thread, question: question)
  }

  private static func prompt(spread: Spread, draws: [Draw]) -> String {
    let cards = zip(spread.slots, draws).map { slot, draw in
      let orientation = draw.reversed ? "reversed" : "upright"
      return """
      - position: \(slot)
        card: \(draw.card.name)
        orientation: \(orientation)
        essence: \(draw.card.essence)
        line: \(draw.line)
        keywords: \(draw.keys.joined(separator: ", "))
      """
    }.joined(separator: "\n")

    return """
    Spread: \(spread.name) — \(spread.sub)
    Positions and cards:
    \(cards)
    """
  }

  private static func outputText(from value: Any) -> String? {
    if let array = value as? [Any] {
      for child in array {
        if let text = outputText(from: child) { return text }
      }
      return nil
    }

    guard let object = value as? [String: Any] else { return nil }

    if object["type"] as? String == "output_text", let text = object["text"] as? String {
      return text
    }

    for key in ["output", "content"] {
      if let child = object[key], let text = outputText(from: child) { return text }
    }

    return nil
  }
}

/// The key to ask with: one from the environment or from a `.env.local`
/// beside a build from source, or else the one pasted into Settings.
@MainActor
private enum APIKeyStore {
  static func value() -> String? {
    if let key = local() { return key }
    // read from the Keychain the first time it is wanted, away from the
    // room; until it has been, there is none
    OpenAIKey.warm()
    return OpenAIKey.kept
  }

  private static func local() -> String? {
    if let value = ProcessInfo.processInfo.environment["OPENAI_API_KEY"], !value.isEmpty {
      return value
    }

    let bundleRoot = Bundle.main.bundleURL
      .deletingLastPathComponent()
      .deletingLastPathComponent()
    let roots = [
      URL(fileURLWithPath: FileManager.default.currentDirectoryPath),
      bundleRoot,
      bundleRoot.deletingLastPathComponent()
    ]

    for root in roots {
      let url = root.appendingPathComponent(".env.local")
      if let value = read(from: url) { return value }
    }
    return nil
  }

  private static func read(from url: URL) -> String? {
    guard let source = try? String(contentsOf: url, encoding: .utf8) else { return nil }

    for line in source.split(whereSeparator: \.isNewline) {
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      guard !trimmed.hasPrefix("#"), let equals = trimmed.firstIndex(of: "=") else { continue }
      let name = trimmed[..<equals].trimmingCharacters(in: .whitespaces)
      guard name == "OPENAI_API_KEY" else { continue }
      var value = trimmed[trimmed.index(after: equals)...].trimmingCharacters(in: .whitespaces)
      if value.hasPrefix("\"") && value.hasSuffix("\"") {
        value = String(value.dropFirst().dropLast())
      }
      if value.hasPrefix("'") && value.hasSuffix("'") {
        value = String(value.dropFirst().dropLast())
      }
      return value.isEmpty ? nil : String(value)
    }
    return nil
  }
}
