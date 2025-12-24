// ============================================
// Speech Recognition Utility
// Uses Web Speech API (built into browsers)
// ============================================

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Check if speech recognition is supported
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
  );
}

// Get the SpeechRecognition constructor
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const win = window as Window & { 
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  
  if (win.SpeechRecognition) {
    return win.SpeechRecognition;
  }
  if (win.webkitSpeechRecognition) {
    return win.webkitSpeechRecognition;
  }
  return null;
}

export interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
  continuous?: boolean;
  language?: string;
}

let currentRecognition: SpeechRecognitionInstance | null = null;

export function startSpeechRecognition(options: SpeechRecognitionOptions): boolean {
  const SpeechRecognitionClass = getSpeechRecognition();
  
  if (!SpeechRecognitionClass) {
    options.onError?.('Speech recognition is not supported in this browser');
    return false;
  }

  // Stop any existing recognition
  if (currentRecognition) {
    currentRecognition.stop();
    currentRecognition = null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = options.language ?? 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      options.onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        options.onResult(finalTranscript);
      } else if (interimTranscript) {
        options.onInterim?.(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access!';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Try again!';
          break;
        case 'network':
          errorMessage = 'Network error. Check your internet connection!';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was stopped';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      options.onError?.(errorMessage);
    };

    recognition.onend = () => {
      currentRecognition = null;
      options.onEnd?.();
    };

    recognition.start();
    currentRecognition = recognition;
    return true;
  } catch (error) {
    console.error('Speech recognition error:', error);
    options.onError?.('Failed to start speech recognition');
    return false;
  }
}

export function stopSpeechRecognition(): void {
  if (currentRecognition) {
    currentRecognition.stop();
    currentRecognition = null;
  }
}

export function isRecognizing(): boolean {
  return currentRecognition !== null;
}
