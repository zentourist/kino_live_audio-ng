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
      <div class="kino-live-audio-player" style="display: none;">
        <audio controls></audio>
      </div>
      <div class="kino-live-audio-error" style="display: none;"></div>
    </div>
  `;

  ctx.importCSS("main.css");

  let mediaRecorder = null;
  let audioChunks = [];
  let stream = null;
  let startTime = null;
  let timerInterval = null;

  const recordBtn = ctx.root.querySelector('[data-action="start"]');
  const stopBtn = ctx.root.querySelector('[data-action="stop"]');
  const clearBtn = ctx.root.querySelector('[data-action="clear"]');
  const statusIndicator = ctx.root.querySelector('.status-indicator');
  const statusText = ctx.root.querySelector('.status-text');
  const timerText = ctx.root.querySelector('.timer-text');
  const playerContainer = ctx.root.querySelector('.kino-live-audio-player');
  const audioPlayer = ctx.root.querySelector('audio');
  const errorContainer = ctx.root.querySelector('.kino-live-audio-error');

  function updateStatus(status, text) {
    statusIndicator.className = `status-indicator status-${status}`;
    statusText.textContent = text;
  }

  function updateTimer() {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
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
    timerText.textContent = '00:00';
  }

  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    updateStatus('error', 'Error');
  }

  function hideError() {
    errorContainer.style.display = 'none';
  }

  async function startRecording() {
    try {
      hideError();

      // Get the MIME type based on the format
      let mimeType;
      switch (config.format) {
        case 'webm':
          mimeType = 'audio/webm';
          break;
        case 'mp3':
          mimeType = 'audio/mpeg';
          break;
        case 'ogg':
          mimeType = 'audio/ogg';
          break;
        case 'wav':
          mimeType = 'audio/wav';
          break;
        default:
          mimeType = 'audio/webm';
      }

      // Check if the MIME type is supported, fallback to webm if not
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} is not supported, falling back to audio/webm`);
        mimeType = 'audio/webm';
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sample_rate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        // Convert blob to ArrayBuffer and send to Elixir
        audioBlob.arrayBuffer().then((buffer) => {
          const info = {
            format: config.format,
            mime_type: mimeType,
            size: buffer.byteLength,
            duration: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
          };

          ctx.pushEvent("audio_data", [info, buffer]);

          // Create URL for playback if auto_play is enabled
          if (config.auto_play) {
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            playerContainer.style.display = 'block';
          }
        });

        updateStatus('ready', 'Recording saved');
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        clearBtn.disabled = false;

        // Clean up the stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
      };

      mediaRecorder.start();
      startTimer();
      updateStatus('recording', 'Recording...');
      recordBtn.disabled = true;
      stopBtn.disabled = false;
      clearBtn.disabled = true;
      playerContainer.style.display = 'none';

    } catch (error) {
      console.error('Error accessing microphone:', error);
      showError('Failed to access microphone. Please grant permission and try again.');
      recordBtn.disabled = false;
      stopBtn.disabled = true;
      resetTimer();
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function clearRecording() {
    audioChunks = [];
    audioPlayer.src = '';
    playerContainer.style.display = 'none';
    updateStatus('ready', 'Ready to record');
    clearBtn.disabled = true;
    resetTimer();
    hideError();
  }

  // Event listeners for buttons
  recordBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);
  clearBtn.addEventListener('click', clearRecording);

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
    console.log('Audio saved:', info);
  });
}
