/**
 * PCM Audio Processor for Web Audio API
 *
 * This AudioWorkletProcessor captures raw PCM audio data and sends it
 * in chunks to the main thread for processing.
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // Get chunk size from options (default to 4800 samples = 100ms at 48kHz)
    this.chunkSize = options.processorOptions?.chunkSize || 4800;
    this.buffer = [];

    console.log(`PCMProcessor initialized with chunk size: ${this.chunkSize} samples`);
  }

  process(inputs, outputs, parameters) {
    // Get the first input (microphone)
    const input = inputs[0];

    if (input.length > 0) {
      // Get the first channel (mono)
      const channelData = input[0];

      // Add samples to buffer
      for (let i = 0; i < channelData.length; i++) {
        this.buffer.push(channelData[i]);
      }

      // When buffer reaches chunk size, send it to main thread
      while (this.buffer.length >= this.chunkSize) {
        const chunk = this.buffer.splice(0, this.chunkSize);
        const float32Array = new Float32Array(chunk);

        // Send the chunk to the main thread
        // We need to transfer the buffer for efficiency
        this.port.postMessage(float32Array.buffer, [float32Array.buffer]);
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor("pcm-processor", PCMProcessor);
