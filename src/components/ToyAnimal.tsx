// ============================================
// Toy Animal Component
// Photo capture and sticker creation from real toys
// ============================================

import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, Species, Personality } from '../types';
import { validateAnimalName } from '../services/contentFilter';
import { fileToDataUrl, processToyStickerPhoto } from '../utils/imageProcessing';
import { VoiceInput } from './VoiceInput';
import styles from './ToyAnimal.module.css';

interface ToyAnimalProps {
  onSave: (animal: Animal) => void;
  onCancel: () => void;
}

type Step = 'capture' | 'crop' | 'details';

const SPECIES_OPTIONS: Species[] = [
  'Horse', 'Cow', 'Pig', 'Sheep', 'Chicken', 
  'Cat', 'Dog', 'Goat', 'Bunny', 'Duck', 'Other'
];

const PERSONALITY_OPTIONS: Personality[] = [
  'Brave', 'Kind', 'Silly', 'Curious', 
  'Calm', 'Adventurous', 'Gentle', 'Playful'
];

export function ToyAnimal({ onSave, onCancel }: ToyAnimalProps) {
  const [step, setStep] = useState<Step>('capture');
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [stickerImage, setStickerImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animal details
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Horse');
  const [personality, setPersonality] = useState<Personality>('Kind');
  const [specialThing, setSpecialThing] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        'Could not access the camera. Try uploading a photo instead! 📷'
      );
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Take photo from camera
  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setRawPhoto(dataUrl);
    stopCamera();
    setStep('crop');
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file! 📸');
      return;
    }
    
    try {
      const dataUrl = await fileToDataUrl(file);
      setRawPhoto(dataUrl);
      stopCamera();
      setStep('crop');
    } catch {
      setError('Could not read that file. Try another one! 📁');
    }
  }, [stopCamera]);

  // Process photo into sticker
  const processPhoto = useCallback(async () => {
    if (!rawPhoto) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const sticker = await processToyStickerPhoto(rawPhoto);
      setStickerImage(sticker);
      setStep('details');
    } catch (err) {
      console.error('Processing error:', err);
      setError('Could not process the photo. Try taking another one! 📷');
    }
    
    setIsProcessing(false);
  }, [rawPhoto]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setRawPhoto(null);
    setStickerImage(null);
    setStep('capture');
  }, []);

  // Save animal
  const handleSave = () => {
    const nameCheck = validateAnimalName(name);
    if (!nameCheck.isAllowed) {
      setError(nameCheck.friendlyMessage || 'Please enter a valid name');
      return;
    }
    
    if (!stickerImage) {
      setError('No photo processed yet!');
      return;
    }

    const animal: Animal = {
      id: uuidv4(),
      createdAt: Date.now(),
      mode: 'toy',
      name: name.trim(),
      species,
      personality,
      colors: {
        primary: '#8B4513', // Default brown for toys
        secondary: '#FFFFFF',
      },
      specialThing: specialThing.trim() || undefined,
      stickerDataUrl: stickerImage,
    };

    onSave(animal);
  };

  // Render based on step
  if (step === 'capture') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>📷 Bring Toy to Life</h2>
          <p className={styles.subtitle}>Take a photo of your toy animal!</p>

          {cameraError ? (
            <div className={styles.cameraError}>
              <span className={styles.errorIcon}>📵</span>
              <p>{cameraError}</p>
            </div>
          ) : (
            <div className={styles.cameraContainer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
                onLoadedMetadata={() => videoRef.current?.play()}
              />
              <div className={styles.cameraOverlay}>
                <div className={styles.cameraFrame} />
              </div>
            </div>
          )}

          <div className={styles.captureButtons}>
            {!cameraError && (
              <>
                <button
                  className={styles.startCameraButton}
                  onClick={startCamera}
                >
                  🎥 Start Camera
                </button>
                <button
                  className={styles.captureButton}
                  onClick={takePhoto}
                >
                  📸 Take Photo
                </button>
              </>
            )}
            
            <div className={styles.divider}>
              <span>or</span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
            <button
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Upload Photo
            </button>
          </div>

          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'crop') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>✂️ Looking Good!</h2>
          <p className={styles.subtitle}>Let's turn this into a sticker</p>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>💭</span>
              {error}
            </div>
          )}

          <div className={styles.previewContainer}>
            {rawPhoto && (
              <img 
                src={rawPhoto} 
                alt="Your toy" 
                className={styles.previewImage}
              />
            )}
          </div>

          <div className={styles.cropActions}>
            <button className={styles.retakeButton} onClick={retakePhoto}>
              🔄 Retake
            </button>
            <button
              className={styles.processButton}
              onClick={processPhoto}
              disabled={isProcessing}
            >
              {isProcessing ? '✨ Processing...' : '✨ Make Sticker'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: details
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.title}>🎉 Looking Great!</h2>
        <p className={styles.subtitle}>Now tell us about your animal</p>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>💭</span>
            {error}
          </div>
        )}

        {/* Sticker Preview */}
        <div className={styles.stickerPreview}>
          {stickerImage && (
            <img 
              src={stickerImage} 
              alt="Your sticker" 
              className={styles.stickerImage}
            />
          )}
        </div>

        {/* Name */}
        <div className={styles.field}>
          <label className={styles.label}>Name *</label>
          <div className={styles.inputWithVoice}>
            <input
              type="text"
              className={styles.input}
              placeholder="What's your animal's name?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
            <VoiceInput 
              onTranscript={(text) => setName(prev => prev + text)}
              placeholder="Say a name..."
            />
          </div>
        </div>

        {/* Species */}
        <div className={styles.field}>
          <label className={styles.label}>Species</label>
          <div className={styles.optionsGrid}>
            {SPECIES_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.optionButton} ${species === s ? styles.optionSelected : ''}`}
                onClick={() => setSpecies(s)}
              >
                {getSpeciesEmoji(s)} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className={styles.field}>
          <label className={styles.label}>Personality</label>
          <div className={styles.optionsGrid}>
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.optionButton} ${styles.personalityOption} ${personality === p ? styles.personalitySelected : ''}`}
                onClick={() => setPersonality(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Special Thing */}
        <div className={styles.field}>
          <label className={styles.label}>Special Thing (optional)</label>
          <div className={styles.inputWithVoice}>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., loves to run, best friend ever"
              value={specialThing}
              onChange={(e) => setSpecialThing(e.target.value)}
              maxLength={100}
            />
            <VoiceInput 
              onTranscript={(text) => setSpecialThing(prev => prev ? prev + ' ' + text : text)}
              placeholder="What makes them special?"
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.backButton} onClick={retakePhoto}>
            ← New Photo
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name}
          >
            💾 Save Animal
          </button>
        </div>
      </div>
    </div>
  );
}

function getSpeciesEmoji(species: string): string {
  const emojis: Record<string, string> = {
    'Horse': '🐴',
    'Cow': '🐄',
    'Pig': '🐷',
    'Sheep': '🐑',
    'Chicken': '🐔',
    'Cat': '🐱',
    'Dog': '🐕',
    'Goat': '🐐',
    'Bunny': '🐰',
    'Duck': '🦆',
    'Other': '🐾',
  };
  return emojis[species] || '🐾';
}
