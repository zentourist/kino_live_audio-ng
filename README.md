# KinoLiveAudio

A modern Kino component for recording raw PCM audio from the browser in Livebook notebooks. This library allows you to capture uncompressed audio samples from the user's microphone using the Web Audio API, making it perfect for voice activity detection (VAD), real-time speech recognition, audio analysis, and custom audio processing.

## Features

- 🎙️ **Raw PCM Audio** - Direct access to uncompressed Float32 audio samples
- 🔥 **Low Latency** - AudioWorklet processing for minimal delay
- 📊 **Real-time Streaming** - Stream audio chunks as they're captured
- 🎚️ **Configurable** - Set sample rate and chunk size precisely
- 🔄 **Programmatic Control** - Start, stop, and clear recordings from Elixir code
- 🎨 **Modern UI** - Clean, responsive interface with visual feedback
- ⏱️ **Recording Timer** - Track recording duration in real-time
- 🧮 **Perfect for DSP** - Ideal for VAD, speech recognition, audio analysis

## Why Raw PCM?

Unlike compressed formats (MP3, WebM), raw PCM gives you direct access to audio samples:
- **Voice Activity Detection (VAD)** - Analyze amplitude and frequency in real-time
- **Speech Recognition** - Feed samples directly to recognition engines
- **Audio Analysis** - Calculate RMS, zero-crossing rate, spectral features
- **Custom Processing** - Apply filters, effects, transformations
- **No Encoding Latency** - No compression/decompression overhead

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

# Read the recorded audio data (raw PCM Float32 samples)
audio_data = KinoLiveAudio.read(recorder)

# audio_data is a binary containing Float32 samples
# Each sample is 4 bytes (32-bit float) between -1.0 and 1.0
```

### Streaming for Real-time VAD

Perfect for voice activity detection:

```elixir
# Stream 30ms chunks at 16kHz
recorder = KinoLiveAudio.new(
  chunk_size: 30,
  unit: :ms,
  sample_rate: 16_000
)

# Process chunks in real-time
Kino.listen(recorder, fn chunk ->
  # chunk is raw PCM data (Float32 samples)
  # Calculate RMS energy for VAD
  samples = for <<sample::float-32-little <- chunk>>, do: sample
  rms = :math.sqrt(Enum.sum(Enum.map(samples, &(&1 * &1))) / length(samples))
  
  if rms > 0.02 do
    IO.puts("🎤 Voice detected! RMS: #{Float.round(rms, 4)}")
  end
end)
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
# Record at 16kHz with 30ms chunks (common for speech)
recorder = KinoLiveAudio.new(
  sample_rate: 16_000,
  chunk_size: 30,
  unit: :ms
)

# Or specify chunk size in samples (480 samples = 30ms at 16kHz)
recorder = KinoLiveAudio.new(
  sample_rate: 16_000,
  chunk_size: 480,
  unit: :samples
)
```

### Processing PCM Audio

```elixir
# Record audio
recorder = KinoLiveAudio.new()

# ... user records audio ...

# Get the raw PCM data
audio_data = KinoLiveAudio.read(recorder)

# Convert binary to Float32 samples
samples = for <<sample::float-32-little <- audio_data>>, do: sample

# Now you can process the samples
IO.puts("Total samples: #{length(samples)}")
IO.puts("Duration: #{length(samples) / 48_000} seconds")

# Calculate basic statistics
max_amplitude = Enum.max(samples)
min_amplitude = Enum.min(samples)
IO.puts("Amplitude range: #{min_amplitude} to #{max_amplitude}")
```

### Streaming Audio Chunks for VAD

For real-time voice activity detection:

```elixir
defmodule SimpleVAD do
  # Calculate RMS (Root Mean Square) energy
  def calculate_rms(pcm_binary) do
    samples = for <<sample::float-32-little <- pcm_binary>>, do: sample
    sum_squares = Enum.reduce(samples, 0, fn s, acc -> acc + s * s end)
    :math.sqrt(sum_squares / length(samples))
  end
  
  # Detect voice based on energy threshold
  def voice_active?(pcm_binary, threshold \\ 0.02) do
    calculate_rms(pcm_binary) > threshold
  end
end

# Create recorder with streaming
recorder = KinoLiveAudio.new(
  chunk_size: 30,
  unit: :ms,
  sample_rate: 16_000
)

# Process chunks for VAD
Kino.listen(recorder, fn chunk ->
  if SimpleVAD.voice_active?(chunk) do
    IO.puts("🎤 Voice detected!")
    # Send to speech recognition, save, etc.
  else
    IO.puts("🔇 Silence")
  end
end)

# Start recording
KinoLiveAudio.start_recording(recorder)
```

### Converting PCM to WAV

To save as a WAV file, you'll need to add the WAV header:

```elixir
defmodule WAVConverter do
  def pcm_to_wav(pcm_data, sample_rate, channels \\ 1) do
    # PCM data is Float32, convert to Int16 for WAV
    samples = for <<sample::float-32-little <- pcm_data>> do
      # Clamp and convert to 16-bit integer
      int_sample = trunc(sample * 32767)
      max(min(int_sample, 32767), -32768)
    end
    
    pcm_int16 = for sample <- samples, into: <<>> do
      <<sample::little-signed-16>>
    end
    
    data_size = byte_size(pcm_int16)
    
    # Build WAV header
    <<
      # RIFF header
      "RIFF",
      data_size + 36::little-32,
      "WAVE",
      # fmt chunk
      "fmt ",
      16::little-32,  # fmt chunk size
      1::little-16,   # PCM format
      channels::little-16,
      sample_rate::little-32,
      sample_rate * channels * 2::little-32,  # byte rate
      channels * 2::little-16,  # block align
      16::little-16,  # bits per sample
      # data chunk
      "data",
      data_size::little-32,
      pcm_int16::binary
    >>
  end
end

# Use it
recorder = KinoLiveAudio.new(sample_rate: 16_000)
# ... record ...
pcm_data = KinoLiveAudio.read(recorder)
wav_data = WAVConverter.pcm_to_wav(pcm_data, 16_000)
File.write!("recording.wav", wav_data)
```

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

- `:sample_rate` - The sample rate for recording in Hz. Common values: `8000`, `16000`, `44100`, `48000`.
  Default: `48000`

- `:chunk_size` - Size of audio chunks to stream during recording. When set, audio chunks will be emitted
  as events that can be consumed with `Kino.listen/2`. Set to `nil` to disable streaming.
  Default: `nil`

- `:unit` - Unit for the `:chunk_size` option. Either `:ms` (milliseconds) or `:samples`.
  Default: `:ms`

## Audio Format Details

The audio data is raw PCM in **32-bit float little-endian** format (`pcm_f32le`):
- Each sample is 4 bytes
- Sample values range from -1.0 to 1.0
- Mono (single channel)
- No compression

To read the samples in Elixir:
```elixir
samples = for <<sample::float-32-little <- audio_data>>, do: sample
```

## Chunk Size Guidelines

For streaming audio:

- **10-30ms** - Ideal for real-time VAD and low-latency applications
- **30-50ms** - Good balance for speech recognition
- **100ms+** - Suitable for analysis that doesn't require immediate response

At 16kHz sample rate:
- 10ms = 160 samples = 640 bytes
- 30ms = 480 samples = 1920 bytes  
- 100ms = 1600 samples = 6400 bytes

## API Reference

### Functions

- `new(opts \\ [])` - Creates a new live audio recorder
- `read(recorder)` - Reads the recorded audio data as raw PCM binary (returns binary or nil)
- `start_recording(recorder)` - Starts recording programmatically
- `stop_recording(recorder)` - Stops recording programmatically
- `clear(recorder)` - Clears the recorded audio data

## Browser Compatibility

This library uses the Web Audio API with AudioWorklet which is supported in:

- Chrome/Edge 66+
- Firefox 76+
- Safari 14.1+
- Opera 53+

## Permissions

The browser will request microphone permissions when you start recording. Make sure to grant permission when prompted.

## Technical Details

### Audio Pipeline

1. **getUserMedia** - Captures audio from microphone
2. **AudioContext** - Creates audio processing context at specified sample rate
3. **AudioWorklet** - Processes audio in separate thread for low latency
4. **PCM Processor** - Buffers samples and emits chunks
5. **Float32Array** - Transfers raw samples to main thread
6. **Binary Transfer** - Sends to Elixir as ArrayBuffer
7. **Elixir Processing** - Raw samples available for VAD, DSP, etc.

### Data Flow

```
Microphone → AudioContext → AudioWorklet → PCM Chunks → Elixir
                                ↓
                            Float32 Samples
```

### Why AudioWorklet?

AudioWorklet runs in a separate audio rendering thread:
- **Lower latency** than ScriptProcessorNode (deprecated)
- **No audio glitches** from main thread blocking
- **Real-time processing** capabilities
- **Precise chunk control**

## Examples

Check out the `examples/` directory for more usage examples (coming soon).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Kino](https://github.com/livebook-dev/kino) for Livebook
- Inspired by the original [KinoLiveAudio](https://hexdocs.pm/kino_live_audio) library
