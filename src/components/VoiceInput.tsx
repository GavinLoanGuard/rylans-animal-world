// ============================================
// Voice Input Component
// Microphone button that converts speech to text
// ============================================

import { useState, useEffect } from 'react';
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  stopSpeechRecognition,
  isRecognizing,
} from '../utils/speechRecognition';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function VoiceInput({ onTranscript, disabled = false, placeholder }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [isSupported] = useState(isSpeechRecognitionSupported());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecognizing()) {
        stopSpeechRecognition();
      }
    };
  }, []);

  const handleToggle = () => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
      setInterim('');
    } else {
      const started = startSpeechRecognition({
        onResult: (transcript) => {
          onTranscript(transcript);
          setInterim('');
        },
        onInterim: (transcript) => {
          setInterim(transcript);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsListening(false);
          setInterim('');
          // Show friendly error for kids
          if (error.includes('denied')) {
            alert('🎤 Please allow microphone access to use voice input!');
          }
        },
        onEnd: () => {
          setIsListening(false);
          setInterim('');
        },
        onStart: () => {
          setIsListening(true);
        },
        continuous: false,
      });

      if (!started) {
        alert('🎤 Voice input is not available in this browser. Try Chrome or Safari!');
      }
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Speak to type'}
      >
        {isListening ? (
          <span className={styles.listeningIcon}>
            <span className={styles.pulse}></span>
            🎤
          </span>
        ) : (
          '🎤'
        )}
      </button>
      
      {isListening && (
        <div className={styles.feedback}>
          <span className={styles.dot}></span>
          <span className={styles.text}>
            {interim || placeholder || 'Listening...'}
          </span>
        </div>
      )}
    </div>
  );
}
