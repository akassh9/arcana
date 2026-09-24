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
    case request
    case response
    case invalidResult
  }

  private let endpoint = URL(string: "https://api.openai.com/v1/responses")!

  // The reader's written question is never part of this request.
  func make(spread: Spread, draws: [Draw]) async throws -> WeaveResult {
    guard let key = APIKeyStore.value() else { throw Failure.missingKey }

    let payload: [String: Any] = [
      "model": ProcessInfo.processInfo.environment["ARCANA_AI_MODEL"] ?? "gpt-5",
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

    var request = URLRequest(url: endpoint)
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

    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
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

private enum APIKeyStore {
  static func value() -> String? {
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
