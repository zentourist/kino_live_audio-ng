# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-11

### Added
- Initial release of KinoLiveAudio with raw PCM audio support
- **Raw PCM audio capture** using Web Audio API with AudioWorklet
- **Low-latency audio processing** for real-time applications
- Real-time audio chunk streaming with configurable chunk size
- **Voice Activity Detection (VAD)** ready - direct access to Float32 samples
- Modern, responsive UI with visual feedback
- Real-time recording timer
- Programmatic control (start, stop, clear)
- Configurable sample rate (8kHz, 16kHz, 44.1kHz, 48kHz)
- Binary data transfer to Elixir with efficient ArrayBuffer transfer
- **Kino.listen integration** - Process audio chunks in real-time using `Kino.listen/2`
- **Flexible chunk sizing** - Configure chunks by milliseconds or samples
- Comprehensive documentation with VAD examples
- Full test coverage

### Features
- `KinoLiveAudio.new/1` - Create a new audio recorder with options
  - `:sample_rate` - Sample rate for recording (default: 48000)
  - `:chunk_size` - Enable streaming with configurable chunk size (default: nil)
  - `:unit` - Chunk size unit (:ms or :samples) (default: :ms)
- `KinoLiveAudio.read/1` - Read recorded audio data as raw PCM Float32
- `KinoLiveAudio.start_recording/1` - Start recording programmatically
- `KinoLiveAudio.stop_recording/1` - Stop recording programmatically
- `KinoLiveAudio.clear/1` - Clear recorded audio
- Browser compatibility with Chrome 66+, Firefox 76+, Safari 14.1+, Edge 66+, Opera 53+
- Microphone permission handling with user-friendly error messages
- Real-time audio chunk streaming via `emit_event/2` for `Kino.listen/2` integration
- AudioWorklet processor for low-latency, glitch-free audio processing
- PCM format: 32-bit float little-endian (pcm_f32le), mono channel

### Use Cases
- Voice Activity Detection (VAD)
- Real-time speech recognition
- Audio analysis and DSP
- Voice command detection
- Audio feature extraction
- Custom audio processing pipelines
- Call analytics and voice biometrics
