import ExpoModulesCore
import Foundation

private struct NativeAssetPaths {
  let modelPath: String
  let tokensPath: String?
  let dataDirPath: String?
  let lexiconPath: String?
  let ruleFstsPaths: [String]
  let configPath: String?
  let voicesPath: String?
}

private struct NativeModelConfig {
  let id: String
  let family: String
  let language: String
  let displayName: String
  let installDir: String
  let assets: NativeAssetPaths
}

private final class CStringStore {
  private var storage: [UnsafeMutablePointer<CChar>] = []

  func cString(_ value: String) -> UnsafePointer<CChar>? {
    let pointer = strdup(value)
    if let pointer {
      storage.append(pointer)
      return UnsafePointer(pointer)
    }
    return nil
  }

  deinit {
    for pointer in storage {
      free(pointer)
    }
  }
}

private final class OfflineTtsHandle {
  private let lock = NSLock()
  private var pointer: OpaquePointer?

  init(pointer: OpaquePointer) {
    self.pointer = pointer
  }

  func generate(text: String, speakerId: Int32, speed: Float) throws -> UnsafePointer<
    SherpaOnnxGeneratedAudio
  > {
    return try lock.withLock {
      guard let pointer else {
        throw ExpoLocalTtsModule.makeError(
          code: 2101, message: "Sherpa engine is already released.")
      }

      return try text.withCString { textPointer in
        guard let audio = SherpaOnnxOfflineTtsGenerate(pointer, textPointer, speakerId, speed)
        else {
          throw ExpoLocalTtsModule.makeError(
            code: 2102, message: "Sherpa generation returned no audio.")
        }
        return audio
      }
    }
  }

  func release() {
    lock.withLock {
      guard let pointer else {
        return
      }

      SherpaOnnxDestroyOfflineTts(pointer)
      self.pointer = nil
    }
  }

  deinit {
    release()
  }
}

private struct ModelState {
  let config: NativeModelConfig
  let initializedAt: String
  let handle: OfflineTtsHandle

  var asMap: [String: Any] {
    return [
      "modelId": config.id,
      "family": config.family,
      "language": config.language,
      "displayName": config.displayName,
      "installDir": config.installDir,
      "initializedAt": initializedAt,
    ]
  }
}

public class ExpoLocalTtsModule: Module {
  private let modelStateQueue = DispatchQueue(
    label: "com.aiorbitstudio.aloudreader.tts.model-state")
  private var modelStates: [String: ModelState] = [:]

  deinit {
    modelStateQueue.sync {
      for state in modelStates.values {
        state.handle.release()
      }
      modelStates.removeAll()
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoLocalTts")

    AsyncFunction("initialize") { (config: [String: Any]) in
      let parsed = try self.parseModelConfig(config)
      let handle = try self.createOfflineTtsHandle(config: parsed)

      self.modelStateQueue.sync {
        if let existing = self.modelStates[parsed.id] {
          existing.handle.release()
        }

        self.modelStates[parsed.id] = ModelState(
          config: parsed,
          initializedAt: ISO8601DateFormatter().string(from: Date()),
          handle: handle
        )
      }
    }

    AsyncFunction("preloadModels") { (configs: [[String: Any]]) in
      for config in configs {
        let parsed = try self.parseModelConfig(config)
        let handle = try self.createOfflineTtsHandle(config: parsed)

        self.modelStateQueue.sync {
          if let existing = self.modelStates[parsed.id] {
            existing.handle.release()
          }

          self.modelStates[parsed.id] = ModelState(
            config: parsed,
            initializedAt: ISO8601DateFormatter().string(from: Date()),
            handle: handle
          )
        }
      }
    }

    AsyncFunction("synthesizeToFile") { (text: String, options: [String: Any]) -> String in
      let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
      if trimmedText.isEmpty {
        throw Self.makeError(code: 2005, message: "Cannot synthesize empty text.")
      }

      guard let modelId = options["modelId"] as? String, !modelId.isEmpty else {
        throw Self.makeError(code: 2006, message: "Missing modelId in synthesize options.")
      }

      let speakerId = Self.toInt32(options["speakerId"]) ?? 0
      let speed = Self.toFloat(options["speed"]) ?? 1.0
      let requestedOutputPath = options["outputPath"] as? String

      let state: ModelState? = self.modelStateQueue.sync {
        return self.modelStates[modelId]
      }
      guard let state else {
        throw Self.makeError(code: 2007, message: "Model is not initialized: \(modelId)")
      }

      let generatedAudio = try state.handle.generate(
        text: trimmedText, speakerId: speakerId, speed: speed)
      defer {
        SherpaOnnxDestroyOfflineTtsGeneratedAudio(generatedAudio)
      }

      let outputURL = try self.resolveOutputURL(path: requestedOutputPath, modelId: modelId)
      try outputURL.deletingLastPathComponent().ensureDirectoryExists()

      // Write a WAV with 50 ms of silence padding at both ends to prevent
      // click/pop artefacts at chunk boundaries during playback.
      try Self.writeWaveWithSilencePadding(
        samples: generatedAudio.pointee.samples,
        count: Int(generatedAudio.pointee.n),
        sampleRate: generatedAudio.pointee.sample_rate,
        to: outputURL
      )

      return outputURL.path
    }

    AsyncFunction("speak") { (_: String, _: [String: Any]) in
      throw Self.makeError(
        code: 2009,
        message:
          "Native local speak() is intentionally not implemented. Use synthesizeToFile() and expo-audio playback."
      )
    }

    AsyncFunction("stop") {
      // No streaming generation is active. Playback stop is handled by JS/expo-audio.
      return
    }

    AsyncFunction("isReady") { (modelId: String) -> Bool in
      return self.modelStateQueue.sync {
        return self.modelStates[modelId] != nil
      }
    }

    AsyncFunction("listInstalledModels") { () -> [[String: Any]] in
      return self.modelStateQueue.sync {
        return self.modelStates.values.map(\.asMap)
      }
    }

    AsyncFunction("uninstallModel") { (modelId: String) in
      self.modelStateQueue.sync {
        if let existing = self.modelStates.removeValue(forKey: modelId) {
          existing.handle.release()
        }
      }
    }

    AsyncFunction("getEngineStatus") { () -> [String: Any] in
      let initializedModelIds = self.modelStateQueue.sync {
        return Array(self.modelStates.keys)
      }

      return [
        "available": true,
        "initializedModelIds": initializedModelIds,
        "message": "Sherpa-ONNX iOS runtime linked and ready.",
      ]
    }
  }

  private func parseModelConfig(_ config: [String: Any]) throws -> NativeModelConfig {
    guard let modelId = config["id"] as? String, !modelId.isEmpty else {
      throw Self.makeError(code: 2001, message: "Missing model id.")
    }
    guard let family = config["family"] as? String, !family.isEmpty else {
      throw Self.makeError(code: 2002, message: "Missing model family for \(modelId).")
    }
    guard let assets = config["assets"] as? [String: Any] else {
      throw Self.makeError(code: 2003, message: "Missing assets config for \(modelId).")
    }
    guard let modelPath = assets["modelPath"] as? String, !modelPath.isEmpty else {
      throw Self.makeError(code: 2004, message: "Missing assets.modelPath for \(modelId).")
    }

    return NativeModelConfig(
      id: modelId,
      family: family,
      language: (config["language"] as? String) ?? "en-US",
      displayName: (config["displayName"] as? String) ?? modelId,
      installDir: Self.normalizeFilePath(config["installDir"] as? String) ?? "",
      assets: NativeAssetPaths(
        modelPath: Self.normalizeFilePath(modelPath) ?? modelPath,
        tokensPath: Self.normalizeFilePath(assets["tokensPath"] as? String),
        dataDirPath: Self.normalizeFilePath(assets["dataDirPath"] as? String),
        lexiconPath: Self.normalizeFilePath(assets["lexiconPath"] as? String),
        ruleFstsPaths: ((assets["ruleFstsPaths"] as? [String]) ?? []).map {
          Self.normalizeFilePath($0) ?? $0
        },
        configPath: Self.normalizeFilePath(assets["configPath"] as? String),
        voicesPath: Self.normalizeFilePath(assets["voicesPath"] as? String)
      )
    )
  }

  private func createOfflineTtsHandle(config: NativeModelConfig) throws -> OfflineTtsHandle {
    try validateFamilyAssets(config)

    let strings = CStringStore()

    var vitsConfig = emptyVitsConfig(strings)
    var matchaConfig = emptyMatchaConfig(strings)
    var kokoroConfig = emptyKokoroConfig(strings)

    switch config.family {
    case "piper", "vits":
      vitsConfig = try buildVitsConfig(config, strings: strings)
    case "kokoro":
      kokoroConfig = try buildKokoroConfig(config, strings: strings)
    case "matcha":
      matchaConfig = try buildMatchaConfig(config, strings: strings)
    default:
      throw Self.makeError(code: 2010, message: "Unsupported model family: \(config.family)")
    }

    let kittenConfig = emptyKittenConfig(strings)
    let zipvoiceConfig = emptyZipvoiceConfig(strings)
    let pocketConfig = emptyPocketConfig(strings)

    var modelConfig = SherpaOnnxOfflineTtsModelConfig(
      vits: vitsConfig,
      num_threads: 2,
      debug: 0,
      provider: strings.cString("cpu"),
      matcha: matchaConfig,
      kokoro: kokoroConfig,
      kitten: kittenConfig,
      zipvoice: zipvoiceConfig,
      pocket: pocketConfig
    )

    var ttsConfig = SherpaOnnxOfflineTtsConfig(
      model: modelConfig,
      rule_fsts: strings.cString(config.assets.ruleFstsPaths.first ?? ""),
      max_num_sentences: 1,
      rule_fars: strings.cString(""),
      silence_scale: 1.0
    )

    guard let pointer = SherpaOnnxCreateOfflineTts(&ttsConfig) else {
      throw Self.makeError(
        code: 2011,
        message: "Failed to create Sherpa-ONNX offline TTS engine for \(config.id)."
      )
    }

    return OfflineTtsHandle(pointer: pointer)
  }

  private func validateFamilyAssets(_ config: NativeModelConfig) throws {
    guard FileManager.default.fileExists(atPath: config.assets.modelPath) else {
      throw Self.makeError(
        code: 2012, message: "Missing assets.modelPath: \(config.assets.modelPath)")
    }

    switch config.family {
    case "piper", "vits":
      guard let tokensPath = config.assets.tokensPath,
        FileManager.default.fileExists(atPath: tokensPath)
      else {
        throw Self.makeError(
          code: 2013, message: "assets.tokensPath is required for family \(config.family).")
      }
    case "kokoro":
      guard let voicesPath = config.assets.voicesPath,
        FileManager.default.fileExists(atPath: voicesPath)
      else {
        throw Self.makeError(
          code: 2014, message: "assets.voicesPath is required for family kokoro.")
      }
      guard let tokensPath = config.assets.tokensPath,
        FileManager.default.fileExists(atPath: tokensPath)
      else {
        throw Self.makeError(
          code: 2015, message: "assets.tokensPath is required for family kokoro.")
      }
    case "matcha":
      guard let tokensPath = config.assets.tokensPath,
        FileManager.default.fileExists(atPath: tokensPath)
      else {
        throw Self.makeError(
          code: 2016, message: "assets.tokensPath is required for family matcha.")
      }
      guard let vocoderPath = resolveMatchaVocoderPath(config),
        FileManager.default.fileExists(atPath: vocoderPath)
      else {
        throw Self.makeError(
          code: 2017,
          message:
            "Unable to locate matcha vocoder ONNX. Add assets.configPath or include a second .onnx in installDir."
        )
      }
    default:
      throw Self.makeError(code: 2018, message: "Unsupported model family: \(config.family)")
    }
  }

  private func buildVitsConfig(
    _ config: NativeModelConfig,
    strings: CStringStore
  ) throws -> SherpaOnnxOfflineTtsVitsModelConfig {
    guard let tokensPath = config.assets.tokensPath else {
      throw Self.makeError(
        code: 2019, message: "assets.tokensPath is required for \(config.family).")
    }

    return SherpaOnnxOfflineTtsVitsModelConfig(
      model: strings.cString(config.assets.modelPath),
      lexicon: strings.cString(config.assets.lexiconPath ?? ""),
      tokens: strings.cString(tokensPath),
      data_dir: strings.cString(config.assets.dataDirPath ?? ""),
      noise_scale: 0.667,
      noise_scale_w: 0.8,
      length_scale: 1.0,
      dict_dir: strings.cString("")
    )
  }

  private func buildKokoroConfig(
    _ config: NativeModelConfig,
    strings: CStringStore
  ) throws -> SherpaOnnxOfflineTtsKokoroModelConfig {
    guard let voicesPath = config.assets.voicesPath else {
      throw Self.makeError(code: 2020, message: "assets.voicesPath is required for kokoro.")
    }
    guard let tokensPath = config.assets.tokensPath else {
      throw Self.makeError(code: 2021, message: "assets.tokensPath is required for kokoro.")
    }

    return SherpaOnnxOfflineTtsKokoroModelConfig(
      model: strings.cString(config.assets.modelPath),
      voices: strings.cString(voicesPath),
      tokens: strings.cString(tokensPath),
      data_dir: strings.cString(config.assets.dataDirPath ?? ""),
      length_scale: 1.0,
      dict_dir: strings.cString(""),
      lexicon: strings.cString(config.assets.lexiconPath ?? ""),
      lang: strings.cString(config.language)
    )
  }

  private func buildMatchaConfig(
    _ config: NativeModelConfig,
    strings: CStringStore
  ) throws -> SherpaOnnxOfflineTtsMatchaModelConfig {
    guard let tokensPath = config.assets.tokensPath else {
      throw Self.makeError(code: 2022, message: "assets.tokensPath is required for matcha.")
    }
    guard let vocoderPath = resolveMatchaVocoderPath(config) else {
      throw Self.makeError(
        code: 2023,
        message:
          "Unable to locate matcha vocoder ONNX. Add assets.configPath or include a second .onnx in installDir."
      )
    }

    return SherpaOnnxOfflineTtsMatchaModelConfig(
      acoustic_model: strings.cString(config.assets.modelPath),
      vocoder: strings.cString(vocoderPath),
      lexicon: strings.cString(config.assets.lexiconPath ?? ""),
      tokens: strings.cString(tokensPath),
      data_dir: strings.cString(config.assets.dataDirPath ?? ""),
      noise_scale: 0.667,
      length_scale: 1.0,
      dict_dir: strings.cString("")
    )
  }

  private func resolveMatchaVocoderPath(_ config: NativeModelConfig) -> String? {
    if let explicit = config.assets.configPath, explicit.lowercased().hasSuffix(".onnx") {
      return explicit
    }

    guard !config.installDir.isEmpty else {
      return nil
    }

    let enumerator = FileManager.default.enumerator(atPath: config.installDir)
    while let next = enumerator?.nextObject() as? String {
      guard next.lowercased().hasSuffix(".onnx") else {
        continue
      }

      let absolute = URL(fileURLWithPath: config.installDir).appendingPathComponent(next).path
      if absolute != config.assets.modelPath {
        return absolute
      }
    }

    return nil
  }

  private func resolveOutputURL(path: String?, modelId: String) throws -> URL {
    let fileManager = FileManager.default
    let fileName = "tts_\(Int(Date().timeIntervalSince1970 * 1000)).wav"

    if path == nil || path?.isEmpty == true {
      let cacheDir = try fileManager.url(
        for: .cachesDirectory,
        in: .userDomainMask,
        appropriateFor: nil,
        create: true
      ).appendingPathComponent("tts/\(modelId)", isDirectory: true)
      return cacheDir.appendingPathComponent(fileName)
    }

    guard let path else {
      throw Self.makeError(code: 2024, message: "Unexpected empty output path.")
    }

    let candidate: URL
    if path.hasPrefix("file://"), let fileURL = URL(string: path), fileURL.isFileURL {
      candidate = fileURL
    } else if path.hasPrefix("/") {
      candidate = URL(fileURLWithPath: path)
    } else {
      let docs = try fileManager.url(
        for: .documentDirectory,
        in: .userDomainMask,
        appropriateFor: nil,
        create: true
      )
      candidate = docs.appendingPathComponent(path)
    }

    if candidate.pathExtension.lowercased() == "wav" {
      return candidate
    }

    return candidate.appendingPathComponent(fileName)
  }

  private func emptyVitsConfig(_ strings: CStringStore) -> SherpaOnnxOfflineTtsVitsModelConfig {
    return SherpaOnnxOfflineTtsVitsModelConfig(
      model: strings.cString(""),
      lexicon: strings.cString(""),
      tokens: strings.cString(""),
      data_dir: strings.cString(""),
      noise_scale: 0.667,
      noise_scale_w: 0.8,
      length_scale: 1.0,
      dict_dir: strings.cString("")
    )
  }

  private func emptyMatchaConfig(_ strings: CStringStore) -> SherpaOnnxOfflineTtsMatchaModelConfig {
    return SherpaOnnxOfflineTtsMatchaModelConfig(
      acoustic_model: strings.cString(""),
      vocoder: strings.cString(""),
      lexicon: strings.cString(""),
      tokens: strings.cString(""),
      data_dir: strings.cString(""),
      noise_scale: 0.667,
      length_scale: 1.0,
      dict_dir: strings.cString("")
    )
  }

  private func emptyKokoroConfig(_ strings: CStringStore) -> SherpaOnnxOfflineTtsKokoroModelConfig {
    return SherpaOnnxOfflineTtsKokoroModelConfig(
      model: strings.cString(""),
      voices: strings.cString(""),
      tokens: strings.cString(""),
      data_dir: strings.cString(""),
      length_scale: 1.0,
      dict_dir: strings.cString(""),
      lexicon: strings.cString(""),
      lang: strings.cString("")
    )
  }

  private func emptyKittenConfig(_ strings: CStringStore) -> SherpaOnnxOfflineTtsKittenModelConfig {
    return SherpaOnnxOfflineTtsKittenModelConfig(
      model: strings.cString(""),
      voices: strings.cString(""),
      tokens: strings.cString(""),
      data_dir: strings.cString(""),
      length_scale: 1.0
    )
  }

  private func emptyZipvoiceConfig(_ strings: CStringStore)
    -> SherpaOnnxOfflineTtsZipvoiceModelConfig
  {
    return SherpaOnnxOfflineTtsZipvoiceModelConfig(
      tokens: strings.cString(""),
      encoder: strings.cString(""),
      decoder: strings.cString(""),
      vocoder: strings.cString(""),
      data_dir: strings.cString(""),
      lexicon: strings.cString(""),
      feat_scale: 1.0,
      t_shift: 0.0,
      target_rms: 0.1,
      guidance_scale: 1.0
    )
  }

  private func emptyPocketConfig(_ strings: CStringStore) -> SherpaOnnxOfflineTtsPocketModelConfig {
    return SherpaOnnxOfflineTtsPocketModelConfig(
      lm_flow: strings.cString(""),
      lm_main: strings.cString(""),
      encoder: strings.cString(""),
      decoder: strings.cString(""),
      text_conditioner: strings.cString(""),
      vocab_json: strings.cString(""),
      token_scores_json: strings.cString(""),
      voice_embedding_cache_capacity: 8
    )
  }

  private static func toInt32(_ value: Any?) -> Int32? {
    if let number = value as? NSNumber {
      return number.int32Value
    }
    if let intValue = value as? Int {
      return Int32(intValue)
    }
    return nil
  }

  private static func toFloat(_ value: Any?) -> Float? {
    if let number = value as? NSNumber {
      return number.floatValue
    }
    if let floatValue = value as? Float {
      return floatValue
    }
    if let doubleValue = value as? Double {
      return Float(doubleValue)
    }
    return nil
  }

  static func makeError(code: Int, message: String) -> NSError {
    return NSError(
      domain: "ExpoLocalTts",
      code: code,
      userInfo: [NSLocalizedDescriptionKey: message]
    )
  }

  private static func normalizeFilePath(_ rawPath: String?) -> String? {
    guard let rawPath else {
      return nil
    }

    let trimmed = rawPath.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      return trimmed
    }

    if trimmed.hasPrefix("file://"), let fileURL = URL(string: trimmed), fileURL.isFileURL {
      return fileURL.path
    }

    return trimmed
  }

  /// Writes a 16-bit PCM WAV file that includes `paddingMs` milliseconds of
  /// silence at both the start and end.  The silence prevents audible
  /// click/pop artefacts when the audio player transitions between chunks.
  private static func writeWaveWithSilencePadding(
    samples: UnsafePointer<Float>?,
    count: Int,
    sampleRate: Int32,
    to outputURL: URL,
    paddingMs: Int = 50
  ) throws {
    let numChannels: UInt16 = 1
    let bitsPerSample: UInt16 = 16
    let paddingSamples = Int(sampleRate) * paddingMs / 1000
    let totalSamples = paddingSamples + count + paddingSamples
    let dataSize = totalSamples * 2  // 2 bytes per PCM-16 sample
    let byteRate = Int(sampleRate) * Int(numChannels) * Int(bitsPerSample / 8)
    let blockAlign = Int(numChannels) * Int(bitsPerSample / 8)
    let riffChunkSize = 36 + dataSize

    var wav = Data(capacity: 44 + dataSize)

    func appendU16LE(_ v: UInt16) {
      var le = v.littleEndian
      withUnsafeBytes(of: &le) { wav.append(contentsOf: $0) }
    }
    func appendU32LE(_ v: UInt32) {
      var le = v.littleEndian
      withUnsafeBytes(of: &le) { wav.append(contentsOf: $0) }
    }

    // RIFF/WAVE header
    wav.append(contentsOf: "RIFF".utf8)
    appendU32LE(UInt32(riffChunkSize))
    wav.append(contentsOf: "WAVE".utf8)
    // fmt sub-chunk
    wav.append(contentsOf: "fmt ".utf8)
    appendU32LE(16)
    appendU16LE(1)  // PCM
    appendU16LE(numChannels)
    appendU32LE(UInt32(sampleRate))
    appendU32LE(UInt32(byteRate))
    appendU16LE(UInt16(blockAlign))
    appendU16LE(bitsPerSample)
    // data sub-chunk
    wav.append(contentsOf: "data".utf8)
    appendU32LE(UInt32(dataSize))
    // leading silence
    wav.append(contentsOf: [UInt8](repeating: 0, count: paddingSamples * 2))
    // audio samples
    if let samples {
      for i in 0..<count {
        let clamped = max(-1.0, min(1.0, samples[i]))
        let pcm16 = Int16(clamped * 32767.0)
        var le = pcm16.littleEndian
        withUnsafeBytes(of: &le) { wav.append(contentsOf: $0) }
      }
    }
    // trailing silence
    wav.append(contentsOf: [UInt8](repeating: 0, count: paddingSamples * 2))

    try wav.write(to: outputURL)
  }
}

extension URL {
  fileprivate func ensureDirectoryExists() throws {
    try FileManager.default.createDirectory(
      at: self,
      withIntermediateDirectories: true,
      attributes: nil
    )
  }
}

extension NSLock {
  @discardableResult
  fileprivate func withLock<T>(_ work: () throws -> T) rethrows -> T {
    lock()
    defer { unlock() }
    return try work()
  }
}
