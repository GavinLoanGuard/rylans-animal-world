// ============================================
// Audio Recording Utilities
// For voice narration on storybook scenes
// ============================================

export interface RecordingState {
  isRecording: boolean;
  audioUrl: string | null;
  error: string | null;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// Start recording
export async function startRecording(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(),
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.start();
  } catch (error) {
    console.error('Error starting recording:', error);
    throw new Error('Could not start recording. Make sure you allowed microphone access! 🎤');
  }
}

// Stop recording and get the audio data URL
export function stopRecording(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No recording in progress'));
      return;
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: getSupportedMimeType() });
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio data'));
      reader.readAsDataURL(audioBlob);
      
      // Stop all tracks
      mediaRecorder?.stream.getTracks().forEach(track => track.stop());
      mediaRecorder = null;
    };
    
    mediaRecorder.stop();
  });
}

// Cancel recording
export function cancelRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    mediaRecorder.stop();
    mediaRecorder = null;
  }
  audioChunks = [];
}

// Check if currently recording
export function isCurrentlyRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
}

// Get supported MIME type for the browser
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  // Fallback
  return 'audio/webm';
}

// Check if audio recording is supported
export function isRecordingSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function' && 
    typeof MediaRecorder !== 'undefined'
  );
}

// Get recording duration (approximate, based on chunks)
export function getRecordingDuration(): number {
  // This is an approximation - for accurate timing, you'd need to track time separately
  return audioChunks.length;
}
