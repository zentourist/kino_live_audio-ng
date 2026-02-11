defmodule KinoLiveAudioTest do
  use ExUnit.Case
  doctest KinoLiveAudio

  describe "new/1" do
    test "creates a recorder with default options" do
      recorder = KinoLiveAudio.new()
      assert %Kino.JS.Live{} = recorder
    end

    test "creates a recorder with custom format" do
      recorder = KinoLiveAudio.new(format: :wav)
      assert %Kino.JS.Live{} = recorder
    end

    test "creates a recorder with custom sample rate" do
      recorder = KinoLiveAudio.new(sample_rate: 44100)
      assert %Kino.JS.Live{} = recorder
    end

    test "creates a recorder with auto_play disabled" do
      recorder = KinoLiveAudio.new(auto_play: false)
      assert %Kino.JS.Live{} = recorder
    end

    test "creates a recorder with streaming enabled" do
      recorder = KinoLiveAudio.new(chunk_size: 30, unit: :ms)
      assert %Kino.JS.Live{} = recorder
    end

    test "creates a recorder with chunk size in samples" do
      recorder = KinoLiveAudio.new(chunk_size: 480, unit: :samples, sample_rate: 16000)
      assert %Kino.JS.Live{} = recorder
    end

    test "raises error for invalid format" do
      assert_raise ArgumentError, fn ->
        KinoLiveAudio.new(format: :invalid)
      end
    end

    test "raises error for invalid sample rate" do
      assert_raise ArgumentError, fn ->
        KinoLiveAudio.new(sample_rate: -1)
      end
    end

    test "raises error for invalid chunk_size" do
      assert_raise ArgumentError, fn ->
        KinoLiveAudio.new(chunk_size: -1)
      end
    end

    test "raises error for invalid unit" do
      assert_raise ArgumentError, fn ->
        KinoLiveAudio.new(chunk_size: 30, unit: :invalid)
      end
    end
  end

  describe "read/1" do
    test "returns nil when no audio has been recorded" do
      recorder = KinoLiveAudio.new()
      assert KinoLiveAudio.read(recorder) == nil
    end
  end

  describe "start_recording/1" do
    test "sends start recording message" do
      recorder = KinoLiveAudio.new()
      assert :ok = KinoLiveAudio.start_recording(recorder)
    end
  end

  describe "stop_recording/1" do
    test "sends stop recording message" do
      recorder = KinoLiveAudio.new()
      assert :ok = KinoLiveAudio.stop_recording(recorder)
    end
  end

  describe "clear/1" do
    test "sends clear message" do
      recorder = KinoLiveAudio.new()
      assert :ok = KinoLiveAudio.clear(recorder)
    end
  end
end
