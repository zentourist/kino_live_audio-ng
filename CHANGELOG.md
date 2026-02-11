# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-10

### Added
- Initial release of KinoLiveAudio
- Live audio recording from the browser using MediaRecorder API
- Support for multiple audio formats: WebM, WAV, MP3, OGG
- Modern, responsive UI with visual feedback
- Real-time recording timer
- Optional automatic playback after recording
- Programmatic control (start, stop, clear)
- Configurable sample rate
- Binary data transfer to Elixir
- **Audio streaming support** - Stream audio chunks in real-time with `chunk_size` option
- **Kino.listen integration** - Process audio chunks as they're recorded using `Kino.listen/2`
- **Flexible chunk sizing** - Configure chunks by milliseconds or samples
- Comprehensive documentation and examples
- Full test coverage

### Features
- `KinoLiveAudio.new/1` - Create a new audio recorder with options
  - `:format` - Audio format (webm, wav, mp3, ogg)
  - `:sample_rate` - Sample rate for recording
  - `:auto_play` - Auto-play after recording
  - `:chunk_size` - Enable streaming with configurable chunk size
  - `:unit` - Chunk size unit (:ms or :samples)
- `KinoLiveAudio.read/1` - Read recorded audio data
- `KinoLiveAudio.start_recording/1` - Start recording programmatically
- `KinoLiveAudio.stop_recording/1` - Stop recording programmatically
- `KinoLiveAudio.clear/1` - Clear recorded audio
- Browser compatibility with Chrome, Firefox, Safari, Edge, and Opera
- Automatic fallback to WebM format when requested format is unsupported
- Microphone permission handling with user-friendly error messages
- Real-time audio chunk streaming via `emit_event/2` for `Kino.listen/2` integration
