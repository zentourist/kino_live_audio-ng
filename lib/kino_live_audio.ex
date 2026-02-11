defmodule KinoLiveAudio do
  @moduledoc """
  A Kino component for recording live audio from the browser in Livebook.

  This component allows you to capture audio from the user's microphone
  and store it as binary data that can be processed or saved. It supports
  both streaming audio chunks in real-time and capturing complete recordings.

  ## Examples

      # Create a simple audio recorder
      recorder = KinoLiveAudio.new()

      # Read the recorded audio data
      audio_data = KinoLiveAudio.read(recorder)

      # Stream audio chunks as they're recorded
      recorder = KinoLiveAudio.new(chunk_size: 30, unit: :ms)

      Kino.listen(recorder, fn chunk ->
        # Process audio chunk in real-time
        IO.inspect(byte_size(chunk))
      end)

      # Start recording programmatically
      KinoLiveAudio.start_recording(recorder)

      # Stop recording programmatically
      KinoLiveAudio.stop_recording(recorder)

      # Clear the recorded audio
      KinoLiveAudio.clear(recorder)

  ## Options

  When creating a new recorder with `new/1`, you can pass the following options:

    * `:format` - the audio format to record in. Supported formats are
      `:wav`, `:webm`, `:mp3`, `:ogg`. Defaults to `:webm` as it has
      the best browser support.

    * `:sample_rate` - the sample rate for recording. Common values are
      `8000`, `16000`, `44100`, `48000`. Defaults to `48000`.

    * `:auto_play` - whether to automatically play back the recording
      when recording stops. Defaults to `true`.

    * `:chunk_size` - the size of audio chunks to stream. When set, audio
      chunks will be emitted as events that can be consumed with `Kino.listen/2`.
      Defaults to `nil` (no streaming).

    * `:unit` - the unit for `:chunk_size`. Either `:ms` (milliseconds) or
      `:samples`. Defaults to `:ms`.

  ## Recording Format

  The recorded audio is stored as binary data. The format depends on
  the browser's support and the specified format option. WebM with
  Opus codec is widely supported across modern browsers.

  To save the audio to a file:

      audio_data = KinoLiveAudio.read(recorder)
      File.write!("recording.webm", audio_data)

  ## Streaming Audio

  When `:chunk_size` is specified, audio chunks will be emitted as events
  during recording. This is useful for real-time audio processing:

      recorder = KinoLiveAudio.new(chunk_size: 100, unit: :ms, sample_rate: 16000)

      Kino.listen(recorder, fn chunk ->
        # Process chunk (e.g., send to speech recognition)
        process_audio_chunk(chunk)
      end)

  """

  use Kino.JS, assets_path: "lib/assets/live_audio"
  use Kino.JS.Live

  @type t :: Kino.JS.Live.t()
  @type audio_format :: :wav | :webm | :mp3 | :ogg

  @doc """
  Creates a new live audio recorder.

  ## Options

    * `:format` - the audio format. Defaults to `:webm`
    * `:sample_rate` - the sample rate in Hz. Defaults to `48000`
    * `:auto_play` - whether to play back after recording. Defaults to `true`
    * `:chunk_size` - size of streaming audio chunks. Defaults to `nil` (no streaming)
    * `:unit` - unit for chunk_size (`:ms` or `:samples`). Defaults to `:ms`

  ## Examples

      KinoLiveAudio.new()
      KinoLiveAudio.new(format: :wav, sample_rate: 44100)
      KinoLiveAudio.new(chunk_size: 30, unit: :ms, sample_rate: 16000)

  """
  @spec new(keyword()) :: t()
  def new(opts \\ []) do
    format = Keyword.get(opts, :format, :webm)
    sample_rate = Keyword.get(opts, :sample_rate, 48000)
    auto_play = Keyword.get(opts, :auto_play, true)
    chunk_size = Keyword.get(opts, :chunk_size)
    unit = Keyword.get(opts, :unit, :ms)

    unless format in [:wav, :webm, :mp3, :ogg] do
      raise ArgumentError,
            "expected :format to be one of :wav, :webm, :mp3, :ogg, got: #{inspect(format)}"
    end

    unless is_integer(sample_rate) and sample_rate > 0 do
      raise ArgumentError,
            "expected :sample_rate to be a positive integer, got: #{inspect(sample_rate)}"
    end

    unless is_nil(chunk_size) or (is_integer(chunk_size) and chunk_size > 0) do
      raise ArgumentError,
            "expected :chunk_size to be a positive integer or nil, got: #{inspect(chunk_size)}"
    end

    unless unit in [:ms, :samples] do
      raise ArgumentError,
            "expected :unit to be :ms or :samples, got: #{inspect(unit)}"
    end

    Kino.JS.Live.new(__MODULE__, %{
      format: format,
      sample_rate: sample_rate,
      auto_play: auto_play,
      chunk_size: chunk_size,
      unit: unit,
      audio_data: nil
    })
  end

  @doc """
  Reads the recorded audio data.

  Returns the audio binary data or `nil` if no recording has been made.

  ## Examples

      recorder = KinoLiveAudio.new()
      # ... user records audio ...
      audio_data = KinoLiveAudio.read(recorder)

  """
  @spec read(t()) :: binary() | nil
  def read(kino) do
    Kino.JS.Live.call(kino, :read)
  end

  @doc """
  Starts recording audio.

  This allows programmatic control of recording.

  ## Examples

      recorder = KinoLiveAudio.new()
      KinoLiveAudio.start_recording(recorder)

  """
  @spec start_recording(t()) :: :ok
  def start_recording(kino) do
    Kino.JS.Live.cast(kino, :start_recording)
  end

  @doc """
  Stops recording audio.

  This allows programmatic control of recording.

  ## Examples

      recorder = KinoLiveAudio.new()
      KinoLiveAudio.stop_recording(recorder)

  """
  @spec stop_recording(t()) :: :ok
  def stop_recording(kino) do
    Kino.JS.Live.cast(kino, :stop_recording)
  end

  @doc """
  Clears the recorded audio data.

  ## Examples

      recorder = KinoLiveAudio.new()
      KinoLiveAudio.clear(recorder)

  """
  @spec clear(t()) :: :ok
  def clear(kino) do
    Kino.JS.Live.cast(kino, :clear)
  end

  @impl true
  def init(config, ctx) do
    {:ok, assign(ctx, config)}
  end

  @impl true
  def handle_connect(ctx) do
    payload = %{
      format: ctx.assigns.format,
      sample_rate: ctx.assigns.sample_rate,
      auto_play: ctx.assigns.auto_play,
      chunk_size: ctx.assigns.chunk_size,
      unit: ctx.assigns.unit
    }

    {:ok, payload, ctx}
  end

  @impl true
  def handle_event("audio_chunk", {:binary, _info, binary}, ctx) do
    # Emit the audio chunk as an event for Kino.listen
    emit_event(ctx, binary)
    {:noreply, ctx}
  end

  def handle_event("audio_data", {:binary, info, binary}, ctx) do
    ctx = assign(ctx, audio_data: binary)
    broadcast_event(ctx, "audio_saved", info)
    {:noreply, ctx}
  end

  @impl true
  def handle_call(:read, _from, ctx) do
    {:reply, ctx.assigns.audio_data, ctx}
  end

  @impl true
  def handle_cast(:start_recording, ctx) do
    broadcast_event(ctx, "start", %{})
    {:noreply, ctx}
  end

  def handle_cast(:stop_recording, ctx) do
    broadcast_event(ctx, "stop", %{})
    {:noreply, ctx}
  end

  def handle_cast(:clear, ctx) do
    ctx = assign(ctx, audio_data: nil)
    broadcast_event(ctx, "clear", %{})
    {:noreply, ctx}
  end
end
