# Troubleshooting: Kino.listen Not Receiving Events

## The Problem

You had code like this that wasn't logging anything:

```elixir
sample_rate = 16_000
live_audio = KinoLiveAudio.new(chunk_size: 30, unit: :ms, sample_rate: sample_rate)

live_audio
|> Kino.listen(fn data ->
  File.write!(Path.join(__DIR__, "files/output.log"), inspect(data))
end)
```

## The Solution

The library has been updated to support streaming audio chunks. Now your exact code should work!

## What Was Missing

The original implementation didn't:
1. Accept the `chunk_size` and `unit` parameters
2. Use `emit_event/2` to emit events for `Kino.listen/2`
3. Configure MediaRecorder to emit chunks at intervals

## How to Verify It's Working

### Step 1: Create the recorder with chunk_size

```elixir
sample_rate = 16_000
live_audio = KinoLiveAudio.new(chunk_size: 30, unit: :ms, sample_rate: sample_rate)
```

**Important:** You MUST specify `chunk_size` for streaming to work. Without it, only the complete recording is saved.

### Step 2: Attach the listener BEFORE recording

```elixir
live_audio
|> Kino.listen(fn data ->
  IO.puts("✅ Received chunk: #{byte_size(data)} bytes")
  File.write!(Path.join(__DIR__, "files/output.log"), inspect(data), [:append])
end)
```

### Step 3: Start recording

Either click the "Start Recording" button in the UI, or programmatically:

```elixir
KinoLiveAudio.start_recording(live_audio)
```

### Step 4: Verify chunks are arriving

You should see output like:
```
✅ Received chunk: 1920 bytes
✅ Received chunk: 1920 bytes
✅ Received chunk: 1920 bytes
```

## Common Issues

### Issue 1: No events at all

**Symptoms:** No output, no log file written

**Causes:**
- `chunk_size` not set (defaults to `nil`)
- Listener attached after recording already started
- Browser permission denied

**Solution:**
```elixir
# Make sure chunk_size is set!
recorder = KinoLiveAudio.new(chunk_size: 30, unit: :ms, sample_rate: 16_000)

# Attach listener BEFORE starting
Kino.listen(recorder, fn chunk -> 
  IO.puts("Got chunk!")
end)

# Then start recording
KinoLiveAudio.start_recording(recorder)
```

### Issue 2: Events arrive but callback doesn't run

**Symptoms:** No errors, but callback code doesn't execute

**Causes:**
- Exception in callback code
- File path doesn't exist
- Process crashed

**Solution:**
```elixir
# Create directory first
File.mkdir_p!(Path.join(__DIR__, "files"))

# Add error handling
Kino.listen(recorder, fn chunk ->
  try do
    File.write!(Path.join(__DIR__, "files/output.log"), inspect(chunk), [:append])
    IO.puts("✅ Wrote #{byte_size(chunk)} bytes")
  rescue
    e -> IO.puts("❌ Error: #{inspect(e)}")
  end
end)
```

### Issue 3: Chunks are empty or wrong size

**Symptoms:** Events arrive but `byte_size(data)` is 0 or unexpected

**Causes:**
- Browser doesn't support the format
- Sample rate not supported by device
- Microphone not connected

**Solution:**
```elixir
# Use default WebM format (best support)
recorder = KinoLiveAudio.new(
  format: :webm,  # Best browser support
  chunk_size: 30,
  unit: :ms,
  sample_rate: 48_000  # More widely supported than 16_000
)

Kino.listen(recorder, fn chunk ->
  if byte_size(chunk) > 0 do
    IO.puts("✅ Good chunk: #{byte_size(chunk)} bytes")
  else
    IO.puts("⚠️  Empty chunk!")
  end
end)
```

### Issue 4: First chunk is late

**Symptoms:** First chunk arrives after 2x chunk_size

**Cause:** This is normal - MediaRecorder needs to buffer

**Solution:** This is expected behavior. The first chunk may take longer.

## Testing Your Setup

Here's a complete test to verify everything works:

```elixir
# Test setup
Mix.install([
  {:kino_live_audio, path: "#{__DIR__}"}
])

# Create output directory
output_dir = Path.join(System.tmp_dir!(), "audio_test")
File.mkdir_p!(output_dir)
output_file = Path.join(output_dir, "test_#{:os.system_time(:second)}.log")

# Create recorder
recorder = KinoLiveAudio.new(
  chunk_size: 50,
  unit: :ms,
  sample_rate: 16_000
)

# Attach listener with logging
chunk_counter = :atomics.new(1, [])

recorder
|> Kino.listen(fn chunk ->
  count = :atomics.add_get(chunk_counter, 1, 1)
  size = byte_size(chunk)
  timestamp = System.monotonic_time(:millisecond)
  
  log_entry = "Chunk ##{count}: #{size} bytes at #{timestamp}ms\n"
  File.write!(output_file, log_entry, [:append])
  
  IO.puts("✅ " <> String.trim(log_entry))
end)

IO.puts("""
🎙️  Test recorder ready!

1. Click 'Start Recording'
2. Speak for a few seconds
3. Click 'Stop Recording'
4. Check the log file: #{output_file}
""")

recorder
```

After recording, check the log file:

```elixir
if File.exists?(output_file) do
  content = File.read!(output_file)
  IO.puts("📄 Log file contents:\n#{content}")
  
  lines = String.split(content, "\n", trim: true)
  IO.puts("\n✅ Received #{length(lines)} chunks")
else
  IO.puts("❌ No log file found - chunks may not be arriving")
end
```

## Expected Behavior

With `chunk_size: 30` and `sample_rate: 16_000`:
- Chunks arrive every ~30ms
- Each chunk is roughly 960-2000 bytes (varies by format)
- First chunk may take 60-100ms
- Chunks continue until you stop recording

## Still Not Working?

Check these:

1. **Elixir version**: `elixir --version` (need 1.19+)
2. **Kino version**: Check mix.lock for kino ~> 0.18.0
3. **Browser console**: Open DevTools and check for JavaScript errors
4. **Microphone permission**: Browser should ask for permission
5. **Audio format support**: Try `:webm` format explicitly

## Debug Mode

Add this to see what's happening:

```elixir
recorder = KinoLiveAudio.new(chunk_size: 30, unit: :ms, sample_rate: 16_000)

# Subscribe to ALL events
Kino.listen(recorder, fn event ->
  IO.inspect(event, label: "Event received", limit: :infinity)
end)

recorder
```

## Get Help

If you're still having issues:

1. Check the implementation: `cat IMPLEMENTATION.md`
2. Try the examples: Open `streaming_example.livemd` in Livebook
3. Run the tests: `mix test`
4. Check for updates to Kino: `mix deps.update kino`

## Success Checklist

- [ ] `chunk_size` is set (not nil)
- [ ] `Kino.listen/2` called before recording
- [ ] Microphone permission granted
- [ ] Recording is actually started
- [ ] Output directory exists (if writing to file)
- [ ] No exceptions in callback
- [ ] Chunks are arriving (check console output)
- [ ] Chunk size > 0

If all checkboxes are checked and it's still not working, there may be a browser compatibility issue or the audio device may not be supported.
