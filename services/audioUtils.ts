/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns Uint8Array of bytes.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 * Assumes 24kHz sample rate and 1 channel as per Gemini API defaults for TTS.
 * 
 * @param data The raw PCM byte array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate (default 24000).
 * @param numChannels Number of channels (default 1).
 * @returns Promise<AudioBuffer>
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Converts an AudioBuffer to a WAV Blob.
 */
export function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');

  // write fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);

  // write data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length * numOfChan * 2, true);

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  offset = 44;
  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][pos])); 
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts AudioBuffer to MP4/WebM Blob using MediaRecorder.
 * Note: Browser support for 'audio/mp4' varies (common in Safari). 
 * Chrome usually defaults to 'audio/webm' which can be renamed to .mp4 or .weba
 */
export async function audioBufferToBlob(buffer: AudioBuffer, format: 'mp4' | 'webm' = 'mp4'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 1. Create an offline context to render the audio into a MediaStream
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    
    // We need to connect to a MediaStreamDestination, but OfflineCtx doesn't support that directly in all browsers easily
    // Alternative: Play it in real-time (silent) or use a workaround.
    // Better approach for CLIENT SIDE encoding without external libs:
    // Use the Wav Blob (PCM) which is already high quality.
    // OR create a standard AudioContext, play it into a destination, and record it. 
    // This is faster than real-time if we use OfflineContext? No, OfflineContext produces an AudioBuffer.
    
    // To record to a compressed format (MP4/WebM), we MUST use MediaRecorder which requires a Stream.
    // We can use a Web Audio API MediaStreamAudioDestinationNode.
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    const rtSource = ctx.createBufferSource();
    rtSource.buffer = buffer;
    rtSource.connect(dest);
    
    // Determine mimeType
    const mimeType = format === 'mp4' 
      ? (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm') // Fallback to webm if mp4 not supported
      : 'audio/webm';
      
    const recorder = new MediaRecorder(dest.stream, { mimeType });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
      rtSource.disconnect();
      ctx.close(); // Clean up
    };
    
    rtSource.start(0);
    recorder.start();
    
    // Stop recording when playback ends
    rtSource.onended = () => {
      recorder.stop();
    };
  });
}