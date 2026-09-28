import CryptoKit
import Security
import SwiftUI

// ===================================================================
//  Settings — one thing to set: an OpenAI key, for find the thread.
//  Pasted here it is kept in the reader's Keychain, never in a file,
//  and OpenAI is asked whether it will take it.
//  Arcana ▸ Settings…, ⌘,
// ===================================================================

struct SettingsView: View {
  @State private var key = ""
  /// The kept key has been read into the field; only then is an edit kept.
  @State private var read = false
  /// What OpenAI said of the key in the field, or that it is being asked.
  @State private var heard: Heard?

  private enum Heard: Equatable {
    case asking
    case said(OpenAIKey.Verdict)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(spacing: 14) {
        Text("OpenAI key")
          .font(.roman(15))
          .foregroundStyle(Palette.text)
        SecureField("sk-…", text: $key)
          .textFieldStyle(.roundedBorder)
          .frame(width: 250)
      }
      VStack(alignment: .leading, spacing: 3) {
        Text(line.text).foregroundStyle(line.color)
        Text("Kept in your Keychain.").foregroundStyle(Palette.text.opacity(0.55))
      }
      .font(.italic(13))
      .animation(.easeOut(duration: 0.2), value: heard)
    }
    .padding(.horizontal, 28)
    .padding(.vertical, 24)
    .background(Palette.pearl)
    .preferredColorScheme(.light)
    .task {
      key = await OpenAIKey.read() ?? ""
      read = true
    }
    .onChange(of: key) { _, k in
      if read { OpenAIKey.keep(k) }
    }
    // asked once the reader pauses, not at every letter
    .task(id: key) { await ask() }
  }

  /// The first line under the field: what OpenAI said of the key, if it
  /// has, else what the key is for.
  private var line: (text: String, color: Color) {
    let quiet = Palette.text.opacity(0.55)
    let k = key.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !k.isEmpty else { return ("For find the thread.", quiet) }
    if OpenAIKey.outOfCredit(k) { return ("This key is out of credit.", Palette.blood) }
    switch heard {
    case .asking: return ("Asking OpenAI…", quiet)
    case .said(.ready): return ("The thread is ready.", Palette.goldInk)
    case .said(.refused): return ("This key won't open the thread.", Palette.blood)
    case .said(.unreachable): return ("OpenAI couldn't be reached.", quiet)
    default: return ("For find the thread.", quiet)
    }
  }

  private func ask() async {
    heard = nil
    let k = key.trimmingCharacters(in: .whitespacesAndNewlines)
    guard read, !k.isEmpty else { return }
    try? await Task.sleep(nanoseconds: 700_000_000)
    guard !Task.isCancelled else { return }
    heard = .asking
    let verdict = await WeaveService.check(k)
    guard !Task.isCancelled else { return }
    heard = verdict.map { .said($0) }
  }
}

/// The key pasted into Settings, as the Keychain keeps it, and what OpenAI
/// has said of keys. The Keychain is only ever touched away from the main
/// thread: after an update macOS may ask the reader to let Arcana read it
/// again, and the room must not stop while it asks.
enum OpenAIKey {
  /// The Keychain item's service; a test keeps its own.
  nonisolated(unsafe) static var service = "local.arcana.reader"
  private static let account = "OpenAI API key"
  private static let label = "Arcana — OpenAI key"
  /// Reads and writes, one at a time, in the order they were asked.
  private static let queue = DispatchQueue(label: "local.arcana.reader.key")

  /// The key, once read; nil until then, or while none is kept.
  @MainActor private(set) static var kept: String?
  @MainActor private static var warmed = false

  /// Read the key once, the first time it is wanted, as the room opens.
  @MainActor static func warm() {
    guard !warmed else { return }
    warmed = true
    Task { _ = await read() }
  }

  /// The key as the Keychain holds it now.
  @MainActor static func read() async -> String? {
    let value = await withCheckedContinuation { done in queue.async { done.resume(returning: copy()) } }
    kept = value
    return value
  }

  /// Keep this key, or, empty, forget the one kept.
  @MainActor static func keep(_ text: String) {
    let key = text.trimmingCharacters(in: .whitespacesAndNewlines)
    kept = key.isEmpty ? nil : key
    queue.async { key.isEmpty ? delete() : write(key) }
  }

  // --- what OpenAI has said -----------------------------------------------

  enum Verdict: Equatable {
    case ready, refused, noCredit, unreachable
  }

  /// The key OpenAI last refused, as a digest, never the key itself; kept
  /// across launches, so a key it will not take is not offered again.
  private static let refusedDefault = "OpenAIKeyRefused"
  /// Keys out of credit this launch. A later launch asks again, since
  /// credit is bought without the key changing.
  @MainActor private static var dry: Set<String> = []

  /// The thread may be offered with this key.
  @MainActor static func usable(_ key: String) -> Bool {
    let d = digest(key)
    return UserDefaults.standard.string(forKey: refusedDefault) != d && !dry.contains(d)
  }

  @MainActor static func outOfCredit(_ key: String) -> Bool { dry.contains(digest(key)) }

  /// What OpenAI said of `key`. That it will take a key says nothing of its
  /// credit, which only a thread can show.
  @MainActor static func heard(_ verdict: Verdict, of key: String) {
    let d = digest(key)
    let defaults = UserDefaults.standard
    switch verdict {
    case .ready:
      if defaults.string(forKey: refusedDefault) == d { defaults.removeObject(forKey: refusedDefault) }
    case .refused:
      defaults.set(d, forKey: refusedDefault)
    case .noCredit:
      dry.insert(d)
    case .unreachable:
      break
    }
  }

  /// A thread was found with `key`: every doubt about it is let go.
  @MainActor static func worked(_ key: String) {
    heard(.ready, of: key)
    dry.remove(digest(key))
  }

  private static func digest(_ key: String) -> String {
    SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
  }

  // --- the Keychain --------------------------------------------------------

  private static var item: [CFString: Any] {
    [kSecClass: kSecClassGenericPassword, kSecAttrService: service, kSecAttrAccount: account]
  }

  private static func copy() -> String? {
    var query = item
    query[kSecReturnData] = true
    query[kSecMatchLimit] = kSecMatchLimitOne
    var found: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &found) == errSecSuccess,
      let data = found as? Data, let key = String(data: data, encoding: .utf8), !key.isEmpty
    else { return nil }
    return key
  }

  private static func write(_ key: String) {
    let data = Data(key.utf8)
    let status = SecItemUpdate(item as CFDictionary, [kSecValueData: data] as CFDictionary)
    guard status == errSecItemNotFound else { return }
    var new = item
    new[kSecValueData] = data
    new[kSecAttrLabel] = label
    SecItemAdd(new as CFDictionary, nil)
  }

  private static func delete() {
    SecItemDelete(item as CFDictionary)
  }
}
