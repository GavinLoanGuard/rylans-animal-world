// ============================================
// Scene Maker Component
// The magic scene generation experience
// ============================================

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, Scene, Location, Settings } from '../types';
import { validateSceneDescription } from '../services/contentFilter';
import { generateSceneImages } from '../services/imageGeneration';
import { VoiceInput } from './VoiceInput';
import styles from './SceneMaker.module.css';

interface SceneMakerProps {
  animals: Animal[];
  settings: Settings;
  onSave: (scene: Scene) => void;
  onCancel: () => void;
  onNavigateToAnimals: () => void;
}

type Step = 'select-animals' | 'configure' | 'generating' | 'results';

const LOCATIONS: { value: Location; emoji: string; label: string }[] = [
  { value: 'Stable', emoji: '🏠', label: 'Cozy Stable' },
  { value: 'Barn', emoji: '🏚️', label: 'Red Barn' },
  { value: 'Pasture', emoji: '🌿', label: 'Green Pasture' },
  { value: 'Meadow', emoji: '🌸', label: 'Flower Meadow' },
  { value: 'Forest Trail', emoji: '🌲', label: 'Forest Trail' },
  { value: 'Riding Arena', emoji: '🏇', label: 'Riding Arena' },
  { value: 'Winter Field', emoji: '❄️', label: 'Winter Field' },
  { value: 'River', emoji: '🌊', label: 'Peaceful River' },
  { value: 'Mountain Path', emoji: '⛰️', label: 'Mountain Path' },
  { value: 'Cozy Farm', emoji: '🌾', label: 'Cozy Farm' },
];

export function SceneMaker({ 
  animals, 
  settings, 
  onSave, 
  onCancel,
  onNavigateToAnimals 
}: SceneMakerProps) {
  const [step, setStep] = useState<Step>('select-animals');
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [location, setLocation] = useState<Location>('Meadow');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [promptUsed, setPromptUsed] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get selected animals
  const selectedAnimals = animals.filter(a => selectedAnimalIds.includes(a.id));

  // Toggle animal selection
  const toggleAnimal = (id: string) => {
    if (selectedAnimalIds.includes(id)) {
      setSelectedAnimalIds(selectedAnimalIds.filter(aid => aid !== id));
    } else if (selectedAnimalIds.length < 3) {
      setSelectedAnimalIds([...selectedAnimalIds, id]);
    }
  };

  // Generate images
  const handleGenerate = async () => {
    // Validate description
    const descCheck = validateSceneDescription(description);
    if (!descCheck.isAllowed) {
      setError(descCheck.friendlyMessage || 'Please describe what\'s happening');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setStep('generating');

    const result = await generateSceneImages(
      selectedAnimals,
      location,
      description,
      settings
    );

    if (result.success && result.images && result.images.length > 0) {
      setGeneratedImages(result.images);
      setPromptUsed(result.promptUsed);
      setStep('results');
    } else {
      setError(result.error || 'Something went wrong');
      setStep('configure');
    }

    setIsGenerating(false);
  };

  // Save scene
  const handleSave = () => {
    if (selectedImageIndex === null) {
      setError('Pick your favorite image first! 🖼️');
      return;
    }

    const scene: Scene = {
      id: uuidv4(),
      createdAt: Date.now(),
      title: title.trim() || `${selectedAnimals.map(a => a.name).join(' & ')}'s Adventure`,
      location,
      animalIds: selectedAnimalIds,
      userDescription: description,
      promptUsed,
      imageDataUrls: generatedImages,
      chosenImageDataUrl: generatedImages[selectedImageIndex],
    };

    onSave(scene);
  };

  // No animals case
  if (animals.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🐴</div>
          <h2 className={styles.emptyTitle}>No Animals Yet!</h2>
          <p className={styles.emptyText}>
            Create some animals first, then come back to make amazing scenes with them!
          </p>
          <button className={styles.createButton} onClick={onNavigateToAnimals}>
            ✨ Create Animals
          </button>
        </div>
      </div>
    );
  }

  // Step: Select Animals
  if (step === 'select-animals') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>🎬 Who's in the Scene?</h2>
          <p className={styles.subtitle}>Pick 1-3 animals from your stable</p>

          <div className={styles.animalGrid}>
            {animals.map((animal) => {
              const isSelected = selectedAnimalIds.includes(animal.id);
              const imageUrl = animal.portraitDataUrl || animal.stickerDataUrl;
              
              return (
                <button
                  key={animal.id}
                  className={`${styles.animalCard} ${isSelected ? styles.animalSelected : ''}`}
                  onClick={() => toggleAnimal(animal.id)}
                  disabled={!isSelected && selectedAnimalIds.length >= 3}
                >
                  <div 
                    className={styles.animalImage}
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  >
                    {!imageUrl && (
                      <span className={styles.animalEmoji}>
                        {getSpeciesEmoji(animal.species)}
                      </span>
                    )}
                    {isSelected && (
                      <div className={styles.checkmark}>✓</div>
                    )}
                  </div>
                  <span className={styles.animalName}>{animal.name}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.selectionInfo}>
            {selectedAnimalIds.length === 0 && (
              <p>Tap to select animals</p>
            )}
            {selectedAnimalIds.length > 0 && selectedAnimalIds.length < 3 && (
              <p>{selectedAnimalIds.length} selected • You can pick up to 3</p>
            )}
            {selectedAnimalIds.length === 3 && (
              <p>3 selected • That's the max!</p>
            )}
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button
              className={styles.nextButton}
              onClick={() => setStep('configure')}
              disabled={selectedAnimalIds.length === 0}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Configure Scene
  if (step === 'configure') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>🎨 Set the Scene</h2>
          
          {/* Selected Animals Preview */}
          <div className={styles.selectedPreview}>
            {selectedAnimals.map((animal) => (
              <div key={animal.id} className={styles.previewAnimal}>
                <span className={styles.previewEmoji}>
                  {getSpeciesEmoji(animal.species)}
                </span>
                <span className={styles.previewName}>{animal.name}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>💭</span>
              {error}
            </div>
          )}

          {/* Location */}
          <div className={styles.field}>
            <label className={styles.label}>Where are they?</label>
            <div className={styles.locationGrid}>
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  className={`${styles.locationButton} ${location === loc.value ? styles.locationSelected : ''}`}
                  onClick={() => setLocation(loc.value)}
                >
                  <span className={styles.locationEmoji}>{loc.emoji}</span>
                  <span className={styles.locationLabel}>{loc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>
              What's happening?
              <VoiceInput 
                onTranscript={(text) => setDescription(prev => prev ? prev + ' ' + text : text)}
                placeholder="Tell me the story..."
              />
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Describe the scene! What are your animals doing? Or tap the 🎤 to speak!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <span className={styles.charCount}>{description.length}/500</span>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.backButton} 
              onClick={() => setStep('select-animals')}
            >
              ← Back
            </button>
            <button
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={!description.trim()}
            >
              ✨ Make Pictures!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Generating
  if (step === 'generating') {
    return (
      <div className={styles.page}>
        <div className={styles.generating}>
          <div className={styles.sparkleContainer}>
            <div className={`${styles.sparkle} ${styles.sparkle1}`}>✨</div>
            <div className={`${styles.sparkle} ${styles.sparkle2}`}>🌟</div>
            <div className={`${styles.sparkle} ${styles.sparkle3}`}>💫</div>
            <div className={`${styles.sparkle} ${styles.sparkle4}`}>⭐</div>
          </div>
          <div className={styles.generatingIcon}>🎨</div>
          <h2 className={styles.generatingTitle}>Creating Your Scene...</h2>
          <p className={styles.generatingText}>
            The magic is happening! This might take a moment.
          </p>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
        </div>
      </div>
    );
  }

  // Step: Results
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.title}>🎉 Pick Your Favorite!</h2>
        <p className={styles.subtitle}>Tap the picture you like best</p>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>💭</span>
            {error}
          </div>
        )}

        <div className={styles.resultsGrid}>
          {generatedImages.map((imageUrl, index) => (
            <button
              key={index}
              className={`${styles.resultCard} ${selectedImageIndex === index ? styles.resultSelected : ''}`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img 
                src={imageUrl} 
                alt={`Scene option ${index + 1}`}
                className={styles.resultImage}
              />
              {selectedImageIndex === index && (
                <div className={styles.resultCheck}>⭐</div>
              )}
            </button>
          ))}
        </div>

        {/* Title Input */}
        <div className={styles.field}>
          <label className={styles.label}>Scene Title (optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder={`${selectedAnimals.map(a => a.name).join(' & ')}'s Adventure`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.regenerateButton}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            🔄 New Pictures
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={selectedImageIndex === null}
          >
            📖 Save to Storybook
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
