import Security
import SwiftUI

// ===================================================================
//  Settings — one thing to set: an OpenAI key, for find the thread.
//  Pasted here it is kept in the reader's Keychain, never in a file.
//  Arcana ▸ Settings…, ⌘,
// ===================================================================

struct SettingsView: View {
  @State private var key = ""
  /// The kept key has been read into the field; only then is an edit kept.
  @State private var read = false

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
        Text("For find the thread.")
        Text("Kept in your Keychain.")
      }
      .font(.italic(13))
      .foregroundStyle(Palette.text.opacity(0.55))
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
  }
}

/// The key pasted into Settings, as the Keychain keeps it. The Keychain is
/// only ever touched away from the main thread: after an update macOS may
/// ask the reader to let Arcana read it again, and the room must not stop
/// while it asks.
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
