import AppKit
import SwiftUI

// ===================================================================
//  The page the question is typed on — a real text view, so accents,
//  dead keys and input methods all work, with nothing of it ever drawn:
//  no field, no caret, no cursor, no selection. The sky shows the words.
//
//  Keys reach it through one router. Until a letter is pressed, every key
//  goes exactly where it always has; once the pen has the keys, it keeps
//  them for the rest of the invocation, and the room's keys stand aside.
// ===================================================================

struct QuillField: NSViewRepresentable {
  let game: Game
  let layout: Layout
  let focus: FocusState<Bool>.Binding

  func makeCoordinator() -> Router { Router() }

  func makeNSView(context: Context) -> QuillTextView {
    let tv = QuillTextView(usingTextLayoutManager: false)  // TextKit 1
    tv.configure()
    tv.game = game
    tv.layout = layout
    tv.focus = focus
    context.coordinator.install(tv)
    game.quill.endComposition = { [weak tv] in tv?.endComposition() }
    game.quill.clearPage = { [weak tv] in tv?.clearPage() }
    game.quill.composing = { [weak tv] in tv?.hasMarkedText() ?? false }
    return tv
  }

  func updateNSView(_ tv: QuillTextView, context: Context) {
    tv.game = game
    tv.layout = layout
    tv.focus = focus
  }

  static func dismantleNSView(_ tv: QuillTextView, coordinator: Router) { coordinator.remove() }

  // --- the router ------------------------------------------------------

  /// The router wakes the pen: on the first key it will own, the page is
  /// made first responder and the key is sent round again, so it reaches
  /// the input method the page has just woken. Every key then travels the
  /// ordinary way; the room's own keys stand aside for the ones the pen owns
  /// (`QuillTextView.owns`), and the stage hands those on to the page.
  ///
  /// Releases are the router's too. AppKit never delivers a key-up that
  /// comes while ⌘ is down, and a click can take the page's place as first
  /// responder while a key is still held — so a key the pen took down is
  /// let go here, directly, and a hold's key let go under ⌘ still lets go.
  @MainActor
  final class Router {
    private var monitor: Any?
    private var resign: Any?
    weak var tv: QuillTextView?

    func install(_ tv: QuillTextView) {
      self.tv = tv
      monitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown, .keyUp]) { [weak self] e in
        // local monitors are called on the main thread, with the app's own events
        nonisolated(unsafe) let e = e
        nonisolated(unsafe) var out: NSEvent? = e
        // a nil from the router swallows the key; only a missing router passes it
        MainActor.assumeIsolated { if let self { out = self.route(e) } }
        return out
      }
      resign = NotificationCenter.default.addObserver(
        forName: NSWindow.didResignKeyNotification, object: nil, queue: .main
      ) { [weak self] note in
        MainActor.assumeIsolated {
          guard let tv = self?.tv, note.object as? NSWindow === tv.window else { return }
          tv.abandonKeys()
        }
      }
    }

    func remove() {
      if let m = monitor { NSEvent.removeMonitor(m) }
      if let r = resign { NotificationCenter.default.removeObserver(r) }
      monitor = nil
      resign = nil
    }

    func route(_ e: NSEvent) -> NSEvent? {
      guard let tv, let g = tv.game, e.window === tv.window else { return e }
      if e.type == .keyUp {
        if g.quill.held.contains(e.keyCode) {
          tv.keyUp(with: e)
          return nil
        }
        if e.modifierFlags.contains(.command) && (e.keyCode == 49 || QuillTextView.isReturn(e)) {
          g.releaseHold(by: .key)
        }
        return e
      }
      guard tv.window?.firstResponder !== tv else { return e }
      // a paste is laid on the pen's own page, through the Edit menu; the
      // V key is known by its place, whatever the keyboard's letters
      let paste =
        e.modifierFlags.contains(.command) && !g.holding && g.phase == .invocation
        && (e.keyCode == 9 || e.charactersIgnoringModifiers?.lowercased() == "v")
      guard paste || QuillTextView.owns(e, in: g) else { return e }
      tv.claim()
      guard tv.window?.firstResponder === tv else { return e }
      if paste { return e }
      NSApp.postEvent(e, atStart: true)
      return nil
    }
  }
}

// ===================================================================
//  The text view itself — configured so that nothing of it shows.
// ===================================================================

final class QuillTextView: NSTextView {
  weak var game: Game?
  var layout: Layout?
  var focus: FocusState<Bool>.Binding?

  private var inEdit = false
  private var pasting = false

  // a tapped space writes a space; a held one asks
  private var spaceDown = false
  private var spaceHeld = false
  private var spaceTask: Task<Void, Never>?
  static let spaceHold = 0.28

  /// Whether a key is the pen's: once you are writing, every key but
  /// return and the menus'; on an empty line, only a key that writes; and
  /// always the release of a key the pen took down. While the question is
  /// held the pen takes nothing, but the keys that write are still its own,
  /// so they are simply silent.
  static func owns(_ e: NSEvent, in g: Game) -> Bool {
    guard g.phase == .invocation, g.inspecting == nil else { return false }
    let q = g.quill
    if e.type == .keyUp { return q.held.contains(e.keyCode) }
    guard e.type == .keyDown else { return false }
    let mods = e.modifierFlags
    if mods.contains(.command) || mods.contains(.control) { return false }
    if g.holding { return q.held.contains(e.keyCode) || writes(e) }
    // emptiness, not the invitation's grace, decides: a 2 on an empty line
    // always chooses a spread
    if !q.isEmpty || q.composing() { return !isReturn(e) || q.composing() }
    return writes(e)
  }

  func configure() {
    alphaValue = 0
    drawsBackground = false
    textColor = .clear
    insertionPointColor = .clear
    selectedTextAttributes = [:]
    markedTextAttributes = [.foregroundColor: NSColor.clear]
    isRichText = false
    importsGraphics = false
    allowsUndo = false
    usesFindBar = false
    isFieldEditor = false
    smartInsertDeleteEnabled = false
    isContinuousSpellCheckingEnabled = false
    isGrammarCheckingEnabled = false
    isAutomaticSpellingCorrectionEnabled = false
    isAutomaticTextReplacementEnabled = false
    isAutomaticQuoteSubstitutionEnabled = false
    isAutomaticDashSubstitutionEnabled = false
    isAutomaticLinkDetectionEnabled = false
    isAutomaticDataDetectionEnabled = false
    isAutomaticTextCompletionEnabled = false
    inlinePredictionType = .no
    if #available(macOS 15, *) {
      writingToolsBehavior = .none
      mathExpressionCompletionType = .no
    }
    font = Quill.font
    // one endless line, so the page never grows and ⌘⌫ clears it all
    textContainer?.widthTracksTextView = false
    textContainer?.containerSize = NSSize(width: 1e7, height: 1e7)
    isVerticallyResizable = false
    isHorizontallyResizable = false
    // the sky reads the words; the page itself is not there
    setAccessibilityElement(false)
  }

  // --- nothing drawn, nothing to click, nothing ticking ----------------

  override func draw(_ dirtyRect: NSRect) {}
  override func drawInsertionPoint(in rect: NSRect, color: NSColor, turnedOn flag: Bool) {}
  override var shouldDrawInsertionPoint: Bool { false }
  /// The caret's blink timer would tick at idle; it is never started.
  override func updateInsertionPointStateAndRestartTimer(_ restartFlag: Bool) {}
  override func resetCursorRects() {}
  override func hitTest(_ point: NSPoint) -> NSView? { nil }
  override var canBecomeKeyView: Bool { false }
  override var acceptsFirstResponder: Bool { game?.phase == .invocation }
  override func menu(for event: NSEvent) -> NSMenu? { nil }
  /// A click may take the keys' focus while a key is still down; a space
  /// that has not yet asked stops waiting to, but a key that is holding
  /// the question keeps holding it until it is let go.
  override func resignFirstResponder() -> Bool {
    if !spaceHeld { spaceTask?.cancel() }
    return super.resignFirstResponder()
  }
  override func selectAll(_ sender: Any?) {}
  override func encodeRestorableState(with coder: NSCoder) {}
  override class var restorableStateKeyPaths: [String] { [] }

  /// No Caps Lock or input-source badge beside a caret that isn't there.
  override func preferredTextAccessoryPlacement() -> NSTextCursorAccessoryPlacement { .invisible }

  /// The pen is always at the end of the line.
  override func setSelectedRanges(
    _ ranges: [NSValue], affinity: NSSelectionAffinity, stillSelecting: Bool
  ) {
    if hasMarkedText() {
      super.setSelectedRanges(ranges, affinity: affinity, stillSelecting: stillSelecting)
    } else {
      let end = NSValue(range: NSRange(location: (string as NSString).length, length: 0))
      super.setSelectedRanges([end], affinity: affinity, stillSelecting: false)
    }
  }

  // --- taking and giving back the keys ---------------------------------

  /// Make the pen the first responder, so an input method composes into it.
  func claim() {
    guard let w = window, w.firstResponder !== self, game?.phase == .invocation else { return }
    w.makeFirstResponder(self)
  }

  /// The question has been given, or the invocation has ended: the page
  /// is cleared and the room's keys are handed back, in the same turn.
  func clearPage() {
    inputContext?.discardMarkedText()
    if !string.isEmpty { string = "" }
    spaceTask?.cancel()
    spaceDown = false
    spaceHeld = false
    game?.quill.held = []
    if window?.firstResponder === self {
      window?.makeFirstResponder(nil)
      focus?.wrappedValue = true
    }
  }

  /// What is being composed becomes laid ink.
  func endComposition() {
    guard hasMarkedText() else { return }
    unmarkText()
    inputContext?.discardMarkedText()
    sync()
  }

  /// The window went away mid-key: nothing waits to begin a hold later.
  func abandonKeys() {
    spaceTask?.cancel()
    if spaceHeld { game?.releaseHold(by: .key) }
    spaceDown = false
    spaceHeld = false
    game?.quill.held = []
  }

  // --- keys ------------------------------------------------------------

  static func isReturn(_ e: NSEvent) -> Bool { e.keyCode == 36 || e.keyCode == 76 }

  /// A key that writes: printable, or a dead key waiting for its letter;
  /// never space, return, esc, tab, delete, the arrows, the page keys, the
  /// function keys, or the three spreads.
  static func writes(_ e: NSEvent) -> Bool {
    let mods = e.modifierFlags
    if mods.contains(.command) || mods.contains(.control) { return false }
    let never: Set<UInt16> = [36, 76, 49, 53, 48, 51, 117, 115, 116, 119, 121, 123, 124, 125, 126]
    if never.contains(e.keyCode) { return false }
    if mods.contains(.function) { return false }
    let c = e.characters ?? ""
    if ["1", "2", "3"].contains(c) { return false }
    if c.isEmpty { return !(e.charactersIgnoringModifiers ?? "").isEmpty }  // a dead key
    return c.unicodeScalars.allSatisfy { !CharacterSet.controlCharacters.contains($0) }
  }

  override func keyDown(with e: NSEvent) {
    guard let g = game, g.phase == .invocation else { return }
    g.quill.held.insert(e.keyCode)
    // while the question is held, the pen takes nothing
    if g.holding { return }

    // an input method composing has every key first
    if hasMarkedText() {
      super.keyDown(with: e)
      return
    }
    // a space still resting under the finger is written before the next key
    if spaceDown && e.keyCode != 49 { commitSpace() }

    switch e.keyCode {
    case 49:  // space
      guard !e.isARepeat, !spaceDown else { return }
      spaceDown = true
      spaceHeld = false
      spaceTask?.cancel()
      spaceTask = Task { @MainActor [weak self] in
        try? await Task.sleep(nanoseconds: UInt64(QuillTextView.spaceHold * 1e9))
        guard let self, !Task.isCancelled, self.spaceDown, let g = self.game, let L = self.layout
        else { return }
        self.spaceHeld = true
        g.pressHold(L, by: .key)
      }
    case 53:  // esc, at rest: the whole line is let go; while the light is
      // still draining back, it has been let go already
      if g.holding || g.charge > 0.001 { return }
      g.quill.erase()
    default:
      super.keyDown(with: e)
    }
  }

  override func keyUp(with e: NSEvent) {
    game?.quill.held.remove(e.keyCode)
    guard e.keyCode == 49, spaceDown else { return }
    spaceDown = false
    spaceTask?.cancel()
    if spaceHeld {
      spaceHeld = false
      // a space rested on a moment too long was a space after all
      let brief = (game?.charge ?? 1) < 0.12
      game?.releaseHold(by: .key)
      if brief { write(" ") }
    } else {
      write(" ")
    }
  }

  func commitSpace() {
    spaceTask?.cancel()
    if spaceHeld { game?.releaseHold(by: .key) }
    spaceDown = false
    spaceHeld = false
    write(" ")
  }

  private func write(_ s: String) {
    insertText(s, replacementRange: NSRange(location: NSNotFound, length: 0))
  }

  /// Only deleting — a letter, a word, the line — and letting go.
  override func doCommand(by selector: Selector) {
    switch selector {
    case #selector(deleteBackward(_:)), #selector(deleteWordBackward(_:)),
      #selector(deleteToBeginningOfLine(_:)), #selector(deleteToBeginningOfParagraph(_:)),
      #selector(deleteBackwardByDecomposingPreviousCharacter(_:)):
      super.doCommand(by: selector)
    default:
      // an esc handed on by an input method only ends its composition
      break
    }
  }

  // --- ink --------------------------------------------------------------

  /// The pen takes no ink while the question is held.
  override func shouldChangeText(in affectedCharRange: NSRange, replacementString: String?) -> Bool
  {
    guard let g = game, g.phase == .invocation, !g.holding else { return false }
    return super.shouldChangeText(in: affectedCharRange, replacementString: replacementString)
  }

  override func insertText(_ raw: Any, replacementRange: NSRange) {
    guard let g = game, !g.holding else { return }
    let s = (raw as? NSAttributedString)?.string ?? (raw as? String) ?? ""
    let committed = committedText()
    let clean = Quill.clean(s, after: committed)
    let fit = Quill.room(for: clean, after: committed, pasted: pasting)
    if fit.count < clean.count || (clean.isEmpty && !s.isEmpty && !hasMarkedText()) {
      if fit.count < clean.count { g.quill.spend() }
    }
    inEdit = true
    super.insertText(fit, replacementRange: replacementRange)
    inEdit = false
    sync()
  }

  override func setMarkedText(_ s: Any, selectedRange: NSRange, replacementRange: NSRange) {
    guard game?.holding == false else { return }
    inEdit = true
    super.setMarkedText(s, selectedRange: selectedRange, replacementRange: replacementRange)
    inEdit = false
    sync()
  }

  override func unmarkText() {
    inEdit = true
    super.unmarkText()
    inEdit = false
    sync()
  }

  override func didChangeText() {
    super.didChangeText()
    if !inEdit { sync() }
  }

  override func paste(_ sender: Any?) {
    guard let g = game, !g.holding, g.phase == .invocation,
      let s = NSPasteboard.general.string(forType: .string)
    else { return }
    // a word being composed, or a space still under the finger, comes first
    endComposition()
    if spaceDown && !spaceHeld { commitSpace() }
    pasting = true
    insertText(s, replacementRange: NSRange(location: NSNotFound, length: 0))
    pasting = false
  }
  override func pasteAsPlainText(_ sender: Any?) { paste(sender) }
  override func pasteAsRichText(_ sender: Any?) { paste(sender) }

  private func committedText() -> String {
    let s = string as NSString
    let m = markedRange()
    guard m.location != NSNotFound, m.length > 0 else { return string }
    return s.replacingCharacters(in: m, with: "")
  }

  /// Tell the quill what the page now holds.
  func sync() {
    let s = string as NSString
    let m = markedRange()
    let marked = m.location != NSNotFound && m.length > 0 ? s.substring(with: m) : ""
    game?.quill.take(committed: committedText(), marked: marked)
  }

  /// Candidate windows and the accent popup open at the end of the ink.
  override func firstRect(forCharacterRange range: NSRange, actualRange: NSRangePointer?) -> NSRect {
    guard let w = window, let q = game?.quill else { return .zero }
    let origin = convert(NSPoint.zero, to: nil)
    let inWindow = NSRect(x: origin.x + q.inkWidth / 2 + 4, y: origin.y - 11, width: 1, height: 22)
    return w.convertToScreen(inWindow)
  }
}
