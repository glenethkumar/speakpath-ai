/**
 * Audio Utilities for PCM 16kHz capture and PCM 24kHz playback
 * Designed for Gemini Live speech-to-speech API
 */

// Convert Float32Array audio samples (-1.0 to 1.0) to 16-bit PCM ArrayBuffer
export function float32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }
  return buffer;
}

// Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Int16Array
export function base64ToInt16(base64: string): Int16Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

// Resample audio buffer from input sample rate to target sample rate (e.g. 44.1k/48k -> 16k)
export function resampleAudio(
  input: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return input;
  }
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const index = Math.floor(pos);
    const fraction = pos - index;
    const nextIndex = Math.min(index + 1, input.length - 1);
    result[i] = input[index] * (1 - fraction) + input[nextIndex] * fraction;
  }
  return result;
}

/**
 * PCM Audio Player class for 24kHz Gemini Live output
 */
export class PCMPlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private sampleRate = 24000;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: this.sampleRate });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playChunk(base64Pcm: string) {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const int16Data = base64ToInt16(base64Pcm);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      const audioBuffer = this.audioCtx.createBuffer(1, float32Data.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error('Error playing PCM audio chunk:', err);
    }
  }

  public stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch (e) {}
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public close() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
