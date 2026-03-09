package com.aiorbitstudio.aloudreader.tts

import android.net.Uri
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsKittenModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsKokoroModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsMatchaModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsPocketModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap

private data class NativeAssetPaths(
  val modelPath: String,
  val tokensPath: String?,
  val dataDirPath: String?,
  val lexiconPath: String?,
  val ruleFstsPaths: List<String>,
  val configPath: String?,
  val voicesPath: String?,
)

private data class NativeModelConfig(
  val id: String,
  val family: String,
  val language: String,
  val displayName: String,
  val installDir: String,
  val assets: NativeAssetPaths,
)

private data class ModelState(
  val config: NativeModelConfig,
  val tts: OfflineTts,
  val initializedAt: String,
  val lock: Any = Any(),
) {
  fun asMap(): Map<String, Any> = mapOf(
    "modelId" to config.id,
    "family" to config.family,
    "language" to config.language,
    "displayName" to config.displayName,
    "installDir" to config.installDir,
    "initializedAt" to initializedAt,
  )
}

class ExpoLocalTtsModule : Module() {
  private val modelStates = ConcurrentHashMap<String, ModelState>()

  override fun definition() = ModuleDefinition {
    Name("ExpoLocalTts")

    OnDestroy {
      modelStates.values.forEach { it.tts.release() }
      modelStates.clear()
    }

    AsyncFunction("initialize") { config: Map<String, Any?> ->
      val parsed = parseModelConfig(config)
      val engine = createOfflineTts(parsed)

      val previous = modelStates.put(
        parsed.id,
        ModelState(
          config = parsed,
          tts = engine,
          initializedAt = System.currentTimeMillis().toString(),
        ),
      )

      previous?.tts?.release()
    }

    AsyncFunction("preloadModels") { configs: List<Map<String, Any?>> ->
      configs.forEach { config ->
        val parsed = parseModelConfig(config)
        val engine = createOfflineTts(parsed)

        val previous = modelStates.put(
          parsed.id,
          ModelState(
            config = parsed,
            tts = engine,
            initializedAt = System.currentTimeMillis().toString(),
          ),
        )

        previous?.tts?.release()
      }
    }

    AsyncFunction("synthesizeToFile") { text: String, options: Map<String, Any?> ->
      val trimmedText = text.trim()
      if (trimmedText.isEmpty()) {
        throw IllegalArgumentException("Cannot synthesize empty text.")
      }

      val modelId = options.stringValue("modelId")
        ?: throw IllegalArgumentException("Missing modelId.")
      val speakerId = options.numberValue("speakerId")?.toInt() ?: 0
      val speed = options.numberValue("speed")?.toFloat() ?: 1.0f

      val state = modelStates[modelId]
        ?: throw IllegalStateException("Model is not initialized: $modelId")

      val generatedAudio = synchronized(state.lock) {
        state.tts.generate(trimmedText, speakerId, speed)
      }

      val outputFile = resolveOutputFile(
        requestedPath = options.stringValue("outputPath"),
        modelId = modelId,
      )

      writeWavPCM16(
        out = outputFile,
        floatSamples = generatedAudio.samples,
        sampleRate = generatedAudio.sampleRate,
        channels = 1,
      )

      outputFile.absolutePath
    }

    AsyncFunction("speak") { _text: String, _options: Map<String, Any?> ->
      throw IllegalStateException(
        "Native local speak() is intentionally not implemented. Use synthesizeToFile() and expo-audio playback."
      )
      @Suppress("UNREACHABLE_CODE")
      Unit
    }

    AsyncFunction("stop") {
      // No streaming generation is active in this module. Playback stop is handled by JS queue/expo-audio.
    }

    AsyncFunction("isReady") { modelId: String ->
      modelStates.containsKey(modelId)
    }

    AsyncFunction("listInstalledModels") {
      modelStates.values.map { it.asMap() }
    }

    AsyncFunction("uninstallModel") { modelId: String ->
      val removed = modelStates.remove(modelId)
      removed?.tts?.release()
    }

    AsyncFunction("getEngineStatus") {
      mapOf(
        "available" to true,
        "initializedModelIds" to modelStates.keys.toList(),
        "message" to "Sherpa-ONNX Android runtime linked and ready.",
      )
    }
  }

  private fun createOfflineTts(config: NativeModelConfig): OfflineTts {
    validateFamilyAssets(config)

    val modelConfig = when (config.family) {
      "piper", "vits" -> {
        OfflineTtsModelConfig(
          vits = buildVitsConfig(config),
          matcha = OfflineTtsMatchaModelConfig(),
          kokoro = OfflineTtsKokoroModelConfig(),
          kitten = OfflineTtsKittenModelConfig(),
          pocket = OfflineTtsPocketModelConfig(),
          numThreads = 2,
          debug = false,
          provider = "cpu",
        )
      }
      "kokoro" -> {
        OfflineTtsModelConfig(
          vits = OfflineTtsVitsModelConfig(),
          matcha = OfflineTtsMatchaModelConfig(),
          kokoro = buildKokoroConfig(config),
          kitten = OfflineTtsKittenModelConfig(),
          pocket = OfflineTtsPocketModelConfig(),
          numThreads = 2,
          debug = false,
          provider = "cpu",
        )
      }
      "matcha" -> {
        OfflineTtsModelConfig(
          vits = OfflineTtsVitsModelConfig(),
          matcha = buildMatchaConfig(config),
          kokoro = OfflineTtsKokoroModelConfig(),
          kitten = OfflineTtsKittenModelConfig(),
          pocket = OfflineTtsPocketModelConfig(),
          numThreads = 2,
          debug = false,
          provider = "cpu",
        )
      }
      else -> throw IllegalArgumentException("Unsupported model family: ${config.family}")
    }

    val ttsConfig = OfflineTtsConfig(
      model = modelConfig,
      ruleFsts = config.assets.ruleFstsPaths.firstOrNull() ?: "",
      ruleFars = "",
      maxNumSentences = 1,
      silenceScale = 1.0f,
    )

    // Models are installed to app-private storage and referenced by absolute paths.
    // Passing a non-null AssetManager makes sherpa-onnx treat paths as bundled assets.
    return OfflineTts(null, ttsConfig)
  }

  private fun parseModelConfig(config: Map<String, Any?>): NativeModelConfig {
    val modelId = config.stringValue("id")
      ?: throw IllegalArgumentException("Missing model id.")
    val family = config.stringValue("family")
      ?: throw IllegalArgumentException("Missing model family.")
    val language = config.stringValue("language") ?: "en-US"
    val displayName = config.stringValue("displayName") ?: modelId
    val installDir = config.stringValue("installDir")?.toNativePath().orEmpty()

    val assets = config["assets"] as? Map<*, *>
      ?: throw IllegalArgumentException("Missing assets config for model: $modelId")

    val modelPath = assets.string("modelPath")?.toNativePath()
      ?: throw IllegalArgumentException("Missing assets.modelPath for model: $modelId")

    return NativeModelConfig(
      id = modelId,
      family = family,
      language = language,
      displayName = displayName,
      installDir = installDir,
      assets = NativeAssetPaths(
        modelPath = modelPath,
        tokensPath = assets.string("tokensPath")?.toNativePath(),
        dataDirPath = assets.string("dataDirPath")?.toNativePath(),
        lexiconPath = assets.string("lexiconPath")?.toNativePath(),
        ruleFstsPaths = assets.stringList("ruleFstsPaths").map { it.toNativePath() },
        configPath = assets.string("configPath")?.toNativePath(),
        voicesPath = assets.string("voicesPath")?.toNativePath(),
      ),
    )
  }

  private fun validateFamilyAssets(config: NativeModelConfig) {
    requireExistingFile(config.assets.modelPath, "assets.modelPath")

    when (config.family) {
      "piper", "vits" -> {
        val tokensPath = config.assets.tokensPath
          ?: throw IllegalArgumentException("assets.tokensPath is required for family ${config.family}")
        requireExistingFile(tokensPath, "assets.tokensPath")
      }
      "kokoro" -> {
        val voicesPath = config.assets.voicesPath
          ?: throw IllegalArgumentException("assets.voicesPath is required for family kokoro")
        val tokensPath = config.assets.tokensPath
          ?: throw IllegalArgumentException("assets.tokensPath is required for family kokoro")
        requireExistingFile(voicesPath, "assets.voicesPath")
        requireExistingFile(tokensPath, "assets.tokensPath")
      }
      "matcha" -> {
        val tokensPath = config.assets.tokensPath
          ?: throw IllegalArgumentException("assets.tokensPath is required for family matcha")
        val vocoderPath = resolveMatchaVocoderPath(config)
          ?: throw IllegalArgumentException(
            "Unable to locate matcha vocoder ONNX. Add assets.configPath or place a second .onnx file in installDir."
          )
        requireExistingFile(tokensPath, "assets.tokensPath")
        requireExistingFile(vocoderPath, "matcha.vocoder")
      }
      else -> throw IllegalArgumentException("Unsupported model family: ${config.family}")
    }
  }

  private fun buildVitsConfig(config: NativeModelConfig): OfflineTtsVitsModelConfig {
    val tokensPath = config.assets.tokensPath
      ?: throw IllegalArgumentException("assets.tokensPath is required for family ${config.family}")

    return OfflineTtsVitsModelConfig(
      config.assets.modelPath,
      config.assets.lexiconPath ?: "",
      tokensPath,
      config.assets.dataDirPath ?: "",
      "",
      0.667f,
      0.8f,
      1.0f,
    )
  }

  private fun buildKokoroConfig(config: NativeModelConfig): OfflineTtsKokoroModelConfig {
    val voicesPath = config.assets.voicesPath
      ?: throw IllegalArgumentException("assets.voicesPath is required for family kokoro")
    val tokensPath = config.assets.tokensPath
      ?: throw IllegalArgumentException("assets.tokensPath is required for family kokoro")

    return OfflineTtsKokoroModelConfig(
      config.assets.modelPath,
      voicesPath,
      tokensPath,
      config.assets.dataDirPath ?: "",
      config.assets.lexiconPath ?: "",
      config.language,
      "",
      1.0f,
    )
  }

  private fun buildMatchaConfig(config: NativeModelConfig): OfflineTtsMatchaModelConfig {
    val tokensPath = config.assets.tokensPath
      ?: throw IllegalArgumentException("assets.tokensPath is required for family matcha")
    val vocoderPath = resolveMatchaVocoderPath(config)
      ?: throw IllegalArgumentException(
        "Unable to locate matcha vocoder ONNX. Add assets.configPath or place a second .onnx file in installDir."
      )

    return OfflineTtsMatchaModelConfig(
      config.assets.modelPath,
      vocoderPath,
      config.assets.lexiconPath ?: "",
      tokensPath,
      config.assets.dataDirPath ?: "",
      "",
      0.667f,
      1.0f,
    )
  }

  private fun resolveMatchaVocoderPath(config: NativeModelConfig): String? {
    val configPath = config.assets.configPath
    if (!configPath.isNullOrBlank() && configPath.endsWith(".onnx", ignoreCase = true)) {
      return configPath
    }

    if (config.installDir.isBlank()) {
      return null
    }

    val candidates = File(config.installDir)
      .walkTopDown()
      .filter { it.isFile && it.name.endsWith(".onnx", ignoreCase = true) }
      .map { it.absolutePath }
      .filterNot { it == config.assets.modelPath }
      .toList()

    return candidates.firstOrNull()
  }

  private fun resolveOutputFile(requestedPath: String?, modelId: String): File {
    val context = appContext.reactContext
      ?: throw IllegalStateException("React context is unavailable.")

    val fileName = "tts_${System.currentTimeMillis()}.wav"

    if (requestedPath.isNullOrBlank()) {
      val defaultDir = File(context.cacheDir, "tts/$modelId").apply { mkdirs() }
      return File(defaultDir, fileName)
    }

    val resolvedRequestedPath = requestedPath.toNativePath()
    val raw = File(resolvedRequestedPath)
    val target = if (raw.isAbsolute) raw else File(context.filesDir, resolvedRequestedPath)

    return if (target.name.endsWith(".wav", ignoreCase = true)) {
      target.parentFile?.mkdirs()
      target
    } else {
      target.mkdirs()
      File(target, fileName)
    }
  }

  private fun writeWavPCM16(
    out: File,
    floatSamples: FloatArray,
    sampleRate: Int,
    channels: Int,
  ) {
    out.parentFile?.mkdirs()

    val pcm = ByteArray(floatSamples.size * 2)
    var index = 0
    for (sample in floatSamples) {
      val clamped = sample.coerceIn(-1f, 1f)
      val pcm16 = (clamped * 32767f).toInt().toShort()
      pcm[index++] = (pcm16.toInt() and 0xFF).toByte()
      pcm[index++] = ((pcm16.toInt() shr 8) and 0xFF).toByte()
    }

    val byteRate = sampleRate * channels * 2
    val blockAlign = (channels * 2).toShort()
    val dataSize = pcm.size
    val riffSize = 36 + dataSize

    FileOutputStream(out).use { output ->
      fun writeAscii(value: String) = output.write(value.toByteArray(Charsets.US_ASCII))
      fun writeInt32LE(value: Int) = output.write(
        byteArrayOf(
          (value and 0xFF).toByte(),
          ((value shr 8) and 0xFF).toByte(),
          ((value shr 16) and 0xFF).toByte(),
          ((value shr 24) and 0xFF).toByte(),
        )
      )

      fun writeInt16LE(value: Short) = output.write(
        byteArrayOf(
          (value.toInt() and 0xFF).toByte(),
          ((value.toInt() shr 8) and 0xFF).toByte(),
        )
      )

      writeAscii("RIFF")
      writeInt32LE(riffSize)
      writeAscii("WAVE")
      writeAscii("fmt ")
      writeInt32LE(16)
      writeInt16LE(1)
      writeInt16LE(channels.toShort())
      writeInt32LE(sampleRate)
      writeInt32LE(byteRate)
      writeInt16LE(blockAlign)
      writeInt16LE(16)
      writeAscii("data")
      writeInt32LE(dataSize)
      output.write(pcm)
    }
  }

  private fun requireExistingFile(path: String, label: String) {
    val file = File(path.toNativePath())
    if (!file.exists() || !file.isFile) {
      throw IllegalArgumentException("Missing $label at path: $path")
    }
  }
}

private fun Map<String, Any?>.stringValue(key: String): String? = this[key] as? String

private fun Map<String, Any?>.numberValue(key: String): Number? = this[key] as? Number

private fun Map<*, *>.string(key: String): String? = this[key] as? String

private fun Map<*, *>.stringList(key: String): List<String> {
  val value = this[key] as? List<*> ?: return emptyList()
  return value.mapNotNull { it as? String }
}

private fun String.toNativePath(): String {
  val trimmed = trim()
  if (!trimmed.startsWith("file://")) {
    return trimmed
  }

  val parsed = Uri.parse(trimmed)
  return parsed.path?.takeIf { it.isNotBlank() } ?: trimmed.removePrefix("file://")
}
