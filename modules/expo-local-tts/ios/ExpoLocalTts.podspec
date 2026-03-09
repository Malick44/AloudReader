Pod::Spec.new do |s|
  s.name           = 'ExpoLocalTts'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.5',
    :tvos => '15.5'
  }
  s.source         = { git: '' }
  s.prepare_command = 'bash scripts/ensure_sherpa_ios_binaries.sh'

  s.dependency 'ExpoModulesCore'

  s.vendored_frameworks = [
    'vendor/onnxruntime.xcframework',
    'vendor/sherpa-onnx.xcframework'
  ]
  s.preserve_paths = [
    'vendor/onnxruntime.xcframework',
    'vendor/sherpa-onnx.xcframework'
  ]
  s.public_header_files = 'ExpoLocalTtsSherpaShim.h'

  # Ensure Swift and Objective-C sources share one module namespace.
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
