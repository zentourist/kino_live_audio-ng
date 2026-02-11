export function init(ctx, config) {
  ctx.root.innerHTML = `
    <div class="kino-live-audio-container">
      <div class="kino-live-audio-controls">
        <button class="kino-btn kino-btn-record" data-action="start">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6"/>
          </svg>
          <span>Start Recording</span>
        </button>
        <button class="kino-btn kino-btn-stop" data-action="stop" disabled>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="4" width="8" height="8"/>
          </svg>
          <span>Stop Recording</span>
        </button>
        <button class="kino-btn kino-btn-clear" data-action="clear" disabled>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m2 0v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h10z"/>
          </svg>
          <span>Clear</span>
        </button>
      </div>
      <div class="kino-live-audio-status">
        <span class="status-indicator"></span>
        <span class="status-text">Ready to record</span>
      </div>
      <div class="kino-live-audio-timer">
        <span class="timer-text">00:00</span>
      </div>
      <div class="kino-live-audio-error" style="display: none;"></div>
    </div>
  `;

  ctx.importCSS("main.css");

  let audioContext = null;
  let workletNode = null;
  let stream = null;
  let startTime = null;
  let timerInterval = null;
  let allAudioChunks = [];

  const recordBtn = ctx.root.querySelector('[data-action="start"]');
  const stopBtn = ctx.root.querySelector('[data-action="stop"]');
  const clearBtn = ctx.root.querySelector('[data-action="clear"]');
  const statusIndicator = ctx.root.querySelector(".status-indicator");
  const statusText = ctx.root.querySelector(".status-text");
  const timerText = ctx.root.querySelector(".timer-text");
  const playerContainer = ctx.root.querySelector(".kino-live-audio-player");
  const audioPlayer = ctx.root.querySelector("audio");
  const errorContainer = ctx.root.querySelector(".kino-live-audio-error");

  function updateStatus(status, text) {
    statusIndicator.className = `status-indicator status-${status}`;
    statusText.textContent = text;
  }

  function updateTimer() {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsed % 60).toString().padStart(2, "0");
      timerText.textContent = `${minutes}:${seconds}`;
    }
  }

  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimer() {
    stopTimer();
    startTime = null;
    timerText.textContent = "00:00";
  }

  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
    updateStatus("error", "Error");
  }

  function hideError() {
    errorContainer.style.display = "none";
  }

  async function startRecording() {
    try {
      hideError();

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sample_rate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create AudioContext with the specified sample rate
      audioContext = new AudioContext({ sampleRate: config.sample_rate });

      // Load the AudioWorklet processor
      await audioContext.audioWorklet.addModule("./pcm-processor.js");

      // Calculate chunk size in samples
      let chunkSizeInSamples;
      if (config.chunk_size) {
        if (config.unit === "samples") {
          chunkSizeInSamples = config.chunk_size;
        } else {
          // Convert milliseconds to samples
          chunkSizeInSamples = Math.floor(
            (config.chunk_size / 1000) * config.sample_rate,
          );
        }
      } else {
        // Default: 100ms chunks
        chunkSizeInSamples = Math.floor(0.1 * config.sample_rate);
      }

      // Create the AudioWorklet node
      workletNode = new AudioWorkletNode(audioContext, "pcm-processor", {
        processorOptions: {
          chunkSize: chunkSizeInSamples,
        },
      });

      // Handle PCM audio chunks from the worklet
      workletNode.port.onmessage = (event) => {
        const pcmData = new Float32Array(event.data);
        allAudioChunks.push(pcmData);

        // Convert Float32Array to ArrayBuffer for sending
        const buffer = pcmData.buffer.slice(
          pcmData.byteOffset,
          pcmData.byteOffset + pcmData.byteLength,
        );

        const info = {
          format: "pcm_f32le",
          sample_rate: config.sample_rate,
          channels: 1,
          samples: pcmData.length,
          size: buffer.byteLength,
          timestamp: Date.now(),
        };

        // Send PCM chunk to Elixir
        ctx.pushEvent("audio_chunk", [info, buffer]);
      };

      // Connect the audio graph
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      startTimer();
      updateStatus("recording", "Recording...");
      recordBtn.disabled = true;
      stopBtn.disabled = false;
      clearBtn.disabled = true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      showError(
        "Failed to access microphone. Please grant permission and try again.",
      );
      recordBtn.disabled = false;
      stopBtn.disabled = true;
      resetTimer();
    }
  }

  function stopRecording() {
    if (workletNode) {
      stopTimer();

      // Disconnect and clean up audio nodes
      workletNode.disconnect();
      workletNode = null;

      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }

      // Combine all chunks into a single Float32Array
      const totalSamples = allAudioChunks.reduce(
        (sum, chunk) => sum + chunk.length,
        0,
      );
      const combinedAudio = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of allAudioChunks) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Send complete recording to Elixir
      const buffer = combinedAudio.buffer.slice(
        combinedAudio.byteOffset,
        combinedAudio.byteOffset + combinedAudio.byteLength,
      );

      const info = {
        format: "pcm_f32le",
        sample_rate: config.sample_rate,
        channels: 1,
        samples: combinedAudio.length,
        size: buffer.byteLength,
        duration: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
      };

      ctx.pushEvent("audio_data", [info, buffer]);

      updateStatus("ready", "Recording saved");
      recordBtn.disabled = false;
      stopBtn.disabled = true;
      clearBtn.disabled = false;
    }
  }

  function clearRecording() {
    allAudioChunks = [];
    updateStatus("ready", "Ready to record");
    clearBtn.disabled = true;
    resetTimer();
    hideError();
  }

  // Event listeners for buttons
  recordBtn.addEventListener("click", startRecording);
  stopBtn.addEventListener("click", stopRecording);
  clearBtn.addEventListener("click", clearRecording);

  // Handle events from Elixir
  ctx.handleEvent("start", () => {
    if (!recordBtn.disabled) {
      startRecording();
    }
  });

  ctx.handleEvent("stop", () => {
    if (!stopBtn.disabled) {
      stopRecording();
    }
  });

  ctx.handleEvent("clear", () => {
    clearRecording();
  });

  ctx.handleEvent("audio_saved", (info) => {
    console.log("Audio saved:", info);
  });
}
