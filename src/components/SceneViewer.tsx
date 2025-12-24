// ============================================
// Scene Viewer Component
// Full view of a saved scene with narration
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Scene, Animal } from '../types';
import { 
  startRecording, 
  stopRecording, 
  cancelRecording,
  isRecordingSupported 
} from '../utils/audioRecording';
import styles from './SceneViewer.module.css';

interface SceneViewerProps {
  scene: Scene;
  animals: Animal[];
  onUpdate: (scene: Scene) => void;
  onClose: () => void;
}

export function SceneViewer({ scene, animals, onUpdate, onClose }: SceneViewerProps) {
  const [caption, setCaption] = useState(scene.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [voiceNote, setVoiceNote] = useState(scene.voiceNoteDataUrl || null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get scene animals
  const sceneAnimals = scene.animalIds
    .map(id => animals.find(a => a.id === id))
    .filter(Boolean) as Animal[];

  // Handle caption save
  const handleSaveCaption = () => {
    const updatedScene = { ...scene, caption: caption.trim() || undefined };
    onUpdate(updatedScene);
    setIsEditingCaption(false);
  };

  // Handle voice recording
  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Could not start recording. Make sure you allowed microphone access!');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioDataUrl = await stopRecording();
      setVoiceNote(audioDataUrl);
      setIsRecording(false);
      
      const updatedScene = { ...scene, voiceNoteDataUrl: audioDataUrl };
      onUpdate(updatedScene);
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setIsRecording(false);
  };

  const handleDeleteRecording = () => {
    if (confirm('Delete this voice note?')) {
      setVoiceNote(null);
      const updatedScene = { ...scene, voiceNoteDataUrl: undefined };
      onUpdate(updatedScene);
    }
  };

  // Handle audio playback
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [voiceNote]);

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.viewer}>
      <div className={styles.container}>
        {/* Main Image */}
        <div className={styles.imageSection}>
          <img 
            src={scene.chosenImageDataUrl || scene.imageDataUrls[0]} 
            alt={scene.title}
            className={styles.mainImage}
          />
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h2 className={styles.title}>{scene.title}</h2>
          
          <div className={styles.meta}>
            <span className={styles.location}>📍 {scene.location}</span>
            <span className={styles.date}>{formatDate(scene.createdAt)}</span>
          </div>

          {/* Animals in Scene */}
          <div className={styles.animalsSection}>
            <h3 className={styles.sectionTitle}>Starring</h3>
            <div className={styles.animalsList}>
              {sceneAnimals.map((animal) => (
                <div key={animal.id} className={styles.animalChip}>
                  <span className={styles.animalEmoji}>
                    {getSpeciesEmoji(animal.species)}
                  </span>
                  <span className={styles.animalName}>{animal.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className={styles.captionSection}>
            <h3 className={styles.sectionTitle}>Caption</h3>
            {isEditingCaption ? (
              <div className={styles.captionEdit}>
                <textarea
                  className={styles.captionInput}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for this scene..."
                  maxLength={500}
                  rows={3}
                  autoFocus
                />
                <div className={styles.captionActions}>
                  <button 
                    className={styles.captionCancel}
                    onClick={() => {
                      setCaption(scene.caption || '');
                      setIsEditingCaption(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.captionSave}
                    onClick={handleSaveCaption}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={styles.captionDisplay}
                onClick={() => setIsEditingCaption(true)}
              >
                {scene.caption || (
                  <span className={styles.captionPlaceholder}>
                    Tap to add a caption...
                  </span>
                )}
                <span className={styles.editIcon}>✏️</span>
              </div>
            )}
          </div>

          {/* Voice Narration */}
          <div className={styles.voiceSection}>
            <h3 className={styles.sectionTitle}>Voice Narration</h3>
            
            {voiceNote ? (
              <div className={styles.voicePlayer}>
                <audio ref={audioRef} src={voiceNote} />
                <button 
                  className={styles.playButton}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className={styles.voiceInfo}>
                  <span>Your recording</span>
                </div>
                <button 
                  className={styles.deleteVoice}
                  onClick={handleDeleteRecording}
                >
                  🗑️
                </button>
              </div>
            ) : isRecording ? (
              <div className={styles.recording}>
                <div className={styles.recordingIndicator}>
                  <span className={styles.recordingDot}></span>
                  Recording...
                </div>
                <div className={styles.recordingActions}>
                  <button 
                    className={styles.cancelRecord}
                    onClick={handleCancelRecording}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.stopRecord}
                    onClick={handleStopRecording}
                  >
                    ⏹️ Stop
                  </button>
                </div>
              </div>
            ) : isRecordingSupported() ? (
              <button 
                className={styles.recordButton}
                onClick={handleStartRecording}
              >
                🎤 Record Voice Note
              </button>
            ) : (
              <p className={styles.noRecording}>
                Voice recording is not supported on this device
              </p>
            )}
          </div>

          {/* All Generated Images */}
          {scene.imageDataUrls.length > 1 && (
            <div className={styles.allImagesSection}>
              <button 
                className={styles.toggleImages}
                onClick={() => setShowAllImages(!showAllImages)}
              >
                {showAllImages ? '▼ Hide all images' : '▶ Show all generated images'}
              </button>
              
              {showAllImages && (
                <div className={styles.imageGrid}>
                  {scene.imageDataUrls.map((url, index) => (
                    <img 
                      key={index}
                      src={url}
                      alt={`Option ${index + 1}`}
                      className={`${styles.gridImage} ${url === scene.chosenImageDataUrl ? styles.chosenImage : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <button className={styles.closeButton} onClick={onClose}>
            ← Back to Storybook
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
