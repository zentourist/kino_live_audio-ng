# KinoLiveAudio

A modern Kino component for recording live audio from the browser in Livebook notebooks. This library allows you to capture audio from the user's microphone using the Web Audio API and MediaRecorder, making it perfect for voice recording, audio analysis, and speech processing applications.

## Features

- 🎙️ **Live Audio Recording** - Record audio directly from the browser
- 🎨 **Modern UI** - Clean, responsive interface with visual feedback
- ⏱️ **Recording Timer** - Track recording duration in real-time
- 🔊 **Auto Playback** - Optional automatic playback after recording
- 📊 **Multiple Formats** - Support for WebM, WAV, MP3, and OGG formats
- 🎚️ **Configurable** - Customize sample rate and recording options
- 🔄 **Programmatic Control** - Start, stop, and clear recordings from Elixir code

## Installation

Add `kino_live_audio` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:kino_live_audio, "~> 0.1.0"}
  ]
end
```

Or if you're using the library in a Livebook, you can install it with:

```elixir
Mix.install([
  {:kino_live_audio, "~> 0.1.0"}
])
```

## Usage

### Basic Recording

```elixir
# Create a recorder
recorder = KinoLiveAudio.new()

# The user can now click the "Start Recording" button in the UI
# When they're done, click "Stop Recording"

# Read the recorded audio data
audio_data = KinoLiveAudio.read(recorder)

# Save to a file
File.write!("recording.webm", audio_data)
```

### Programmatic Control

```elixir
# Create a recorder
recorder = KinoLiveAudio.new()

# Start recording from code
KinoLiveAudio.start_recording(recorder)

# Wait for some time or do other work
Process.sleep(5000)

# Stop recording from code
KinoLiveAudio.stop_recording(recorder)

# Read the audio
audio_data = KinoLiveAudio.read(recorder)
```

### Custom Configuration

```elixir
# Record in WAV format at 44.1kHz without auto-play
recorder = KinoLiveAudio.new(
  format: :wav,
  sample_rate: 44100,
  auto_play: false
)

# Record in WebM format (default) at 48kHz
recorder = KinoLiveAudio.new(
  format: :webm,
  sample_rate: 48000
)
```

### Processing Audio

```elixir
# Record audio
recorder = KinoLiveAudio.new()

# ... user records audio ...

# Get the audio data
audio_data = KinoLiveAudio.read(recorder)

# Process with external tools
# For example, convert to WAV using FFmpeg
System.cmd("ffmpeg", [
  "-i", "pipe:0",
  "-f", "wav",
  "output.wav"
], input: audio_data)
```

### Streaming Audio Chunks

For real-time audio processing, you can stream audio chunks as they're recorded:

```elixir
# Create a recorder with streaming enabled
recorder = KinoLiveAudio.new(
  chunk_size: 30,      # 30ms chunks
  unit: :ms,           # or :samples
  sample_rate: 16_000,
  auto_play: false
)

# Listen to audio chunks in real-time
Kino.listen(recorder, fn chunk ->
  IO.puts("Received audio chunk: #{byte_size(chunk)} bytes")
  # Process chunk immediately (e.g., send to real-time transcription)
  process_chunk(chunk)
end)

# Start recording
KinoLiveAudio.start_recording(recorder)
```

This is particularly useful for:
- Real-time speech recognition
- Live audio analysis
- Streaming to external services
- Voice activity detection

### Integration with AI Services

```elixir
# Record audio and transcribe with Whisper API
recorder = KinoLiveAudio.new()

# ... user records audio ...

audio_data = KinoLiveAudio.read(recorder)

# Send to transcription service
# (assuming you have a transcription client configured)
transcription = TranscriptionClient.transcribe(audio_data)
IO.puts("Transcription: #{transcription}")
```

## Configuration Options

When creating a new recorder with `KinoLiveAudio.new/1`, you can pass the following options:

- `:format` - The audio format to record in. Options: `:wav`, `:webm`, `:mp3`, `:ogg`. 
  Default: `:webm` (best browser support)
  
- `:sample_rate` - The sample rate for recording in Hz. Common values: `8000`, `16000`, `44100`, `48000`.
  Default: `48000`
  
- `:auto_play` - Whether to automatically play back the recording when recording stops.
  Default: `true`

- `:chunk_size` - Size of audio chunks to stream during recording. When set, audio chunks will be emitted
  as events that can be consumed with `Kino.listen/2`. Set to `nil` to disable streaming.
  Default: `nil`

- `:unit` - Unit for the `:chunk_size` option. Either `:ms` (milliseconds) or `:samples`.
  Default: `:ms`

## API Reference

### Functions

- `new(opts \\ [])` - Creates a new live audio recorder
- `read(recorder)` - Reads the recorded audio data (returns binary or nil)
- `start_recording(recorder)` - Starts recording programmatically
- `stop_recording(recorder)` - Stops recording programmatically
- `clear(recorder)` - Clears the recorded audio data

## Browser Compatibility

This library uses the MediaRecorder API which is supported in:

- Chrome/Edge 49+
- Firefox 25+
- Safari 14.1+
- Opera 36+

The library will automatically fall back to WebM format if the requested format is not supported by the browser.

## Permissions

The browser will request microphone permissions when you start recording. Make sure to grant permission when prompted.

## Technical Details

### Audio Formats

- **WebM** (default): Best browser support, good compression, uses Opus codec
- **WAV**: Uncompressed, larger file size, best quality
- **MP3**: Good compression, wide compatibility
- **OGG**: Open format, good compression

### Data Flow

1. JavaScript captures audio from the browser using MediaRecorder API
2. Audio is recorded as chunks and combined into a Blob
3. Blob is converted to ArrayBuffer and sent to Elixir via binary payload
4. Elixir stores the binary data and makes it available via `read/1`

## Examples

Check out the `examples/` directory for more usage examples (coming soon).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Kino](https://github.com/livebook-dev/kino) for Livebook
- Inspired by the original [KinoLiveAudio](https://hexdocs.pm/kino_live_audio) library
