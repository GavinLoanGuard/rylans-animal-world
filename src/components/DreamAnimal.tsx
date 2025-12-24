// ============================================
// Dream Animal Component
// Character builder for creating imagined animals
// ============================================

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Animal, Species, Personality, Settings } from '../types';
import { validateAnimalName, checkContent } from '../services/contentFilter';
import { generateAnimalPortrait } from '../services/imageGeneration';
import { VoiceInput } from './VoiceInput';
import styles from './DreamAnimal.module.css';

interface DreamAnimalProps {
  settings: Settings;
  onSave: (animal: Animal) => void;
  onCancel: () => void;
}

const SPECIES_OPTIONS: Species[] = [
  'Horse', 'Cow', 'Pig', 'Sheep', 'Chicken', 
  'Cat', 'Dog', 'Goat', 'Bunny', 'Duck', 'Other'
];

const PERSONALITY_OPTIONS: Personality[] = [
  'Brave', 'Kind', 'Silly', 'Curious', 
  'Calm', 'Adventurous', 'Gentle', 'Playful'
];

const COLOR_PRESETS = [
  '#8B4513', // Brown
  '#F5DEB3', // Tan
  '#FFFFFF', // White
  '#2F2F2F', // Black
  '#D2691E', // Chocolate
  '#FFD700', // Gold
  '#808080', // Gray
  '#FFA07A', // Salmon
  '#DEB887', // Burlywood
  '#CD853F', // Peru
  '#F4A460', // Sandy Brown
  '#B8860B', // Dark Goldenrod
];

export function DreamAnimal({ settings, onSave, onCancel }: DreamAnimalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Horse');
  const [primaryColor, setPrimaryColor] = useState('#8B4513');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [markings, setMarkings] = useState('');
  const [personality, setPersonality] = useState<Personality>('Kind');
  const [specialThing, setSpecialThing] = useState('');
  const [portrait, setPortrait] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGeneratePortrait = async () => {
    // Validate name first
    const nameCheck = validateAnimalName(name);
    if (!nameCheck.isAllowed) {
      setError(nameCheck.friendlyMessage || 'Please enter a valid name');
      return;
    }

    // Check special thing for kid-safe content
    if (specialThing) {
      const specialCheck = checkContent(specialThing, settings.extraGentleMode);
      if (!specialCheck.isAllowed) {
        setError(specialCheck.friendlyMessage || 'Let\'s use friendlier words!');
        return;
      }
    }

    setIsGenerating(true);
    setError(null);

    const tempAnimal: Animal = {
      id: 'temp',
      createdAt: Date.now(),
      mode: 'dream',
      name,
      species,
      personality,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        markings: markings || undefined,
      },
      specialThing: specialThing || undefined,
    };

    const result = await generateAnimalPortrait(tempAnimal, settings);

    if (result.success && result.images && result.images.length > 0) {
      setPortrait(result.images[0]);
    } else {
      setError(result.error || 'Could not generate portrait');
    }

    setIsGenerating(false);
  };

  const handleSave = () => {
    // Validate
    const nameCheck = validateAnimalName(name);
    if (!nameCheck.isAllowed) {
      setError(nameCheck.friendlyMessage || 'Please enter a valid name');
      return;
    }

    if (specialThing) {
      const specialCheck = checkContent(specialThing, settings.extraGentleMode);
      if (!specialCheck.isAllowed) {
        setError(specialCheck.friendlyMessage || 'Let\'s use friendlier words!');
        return;
      }
    }

    setIsSaving(true);

    const animal: Animal = {
      id: uuidv4(),
      createdAt: Date.now(),
      mode: 'dream',
      name: name.trim(),
      species,
      personality,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        markings: markings.trim() || undefined,
      },
      specialThing: specialThing.trim() || undefined,
      portraitDataUrl: portrait || undefined,
    };

    onSave(animal);
  };

  return (
    <div className={styles.page}>
      <div className={styles.form}>
        <h2 className={styles.title}>✨ Dream Up an Animal</h2>
        <p className={styles.subtitle}>Create a new friend for your stable!</p>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>💭</span>
            {error}
          </div>
        )}

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
          <div className={styles.speciesGrid}>
            {SPECIES_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.speciesButton} ${species === s ? styles.speciesSelected : ''}`}
                onClick={() => setSpecies(s)}
              >
                {getSpeciesEmoji(s)} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className={styles.colorSection}>
          <div className={styles.colorField}>
            <label className={styles.label}>Primary Color</label>
            <div className={styles.colorPicker}>
              {COLOR_PRESETS.map((color) => (
                <button
                  key={`primary-${color}`}
                  type="button"
                  className={`${styles.colorSwatch} ${primaryColor === color ? styles.colorSelected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPrimaryColor(color)}
                />
              ))}
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={styles.colorInput}
              />
            </div>
          </div>

          <div className={styles.colorField}>
            <label className={styles.label}>Secondary Color</label>
            <div className={styles.colorPicker}>
              {COLOR_PRESETS.map((color) => (
                <button
                  key={`secondary-${color}`}
                  type="button"
                  className={`${styles.colorSwatch} ${secondaryColor === color ? styles.colorSelected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSecondaryColor(color)}
                />
              ))}
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className={styles.colorInput}
              />
            </div>
          </div>
        </div>

        {/* Markings */}
        <div className={styles.field}>
          <label className={styles.label}>Markings (optional)</label>
          <div className={styles.inputWithVoice}>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., white star on forehead, spots, stripes"
              value={markings}
              onChange={(e) => setMarkings(e.target.value)}
              maxLength={100}
            />
            <VoiceInput 
              onTranscript={(text) => setMarkings(prev => prev ? prev + ' ' + text : text)}
              placeholder="Describe markings..."
            />
          </div>
        </div>

        {/* Personality */}
        <div className={styles.field}>
          <label className={styles.label}>Personality</label>
          <div className={styles.personalityGrid}>
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.personalityButton} ${personality === p ? styles.personalitySelected : ''}`}
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
              placeholder="e.g., loves apples, can run super fast"
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

        {/* Portrait Preview */}
        <div className={styles.portraitSection}>
          <label className={styles.label}>Portrait</label>
          {portrait ? (
            <div className={styles.portraitPreview}>
              <img src={portrait} alt={`Portrait of ${name}`} className={styles.portraitImage} />
              <button
                type="button"
                className={styles.regenerateButton}
                onClick={handleGeneratePortrait}
                disabled={isGenerating || !name}
              >
                {isGenerating ? '✨ Creating...' : '🔄 New Portrait'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.generateButton}
              onClick={handleGeneratePortrait}
              disabled={isGenerating || !name}
            >
              {isGenerating ? (
                <>
                  <span className={styles.sparkles}>✨</span>
                  Creating portrait...
                </>
              ) : (
                <>
                  <span>🎨</span>
                  Generate Portrait
                </>
              )}
            </button>
          )}
          <p className={styles.hint}>
            Portraits are optional! You can add one later.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name || isSaving}
          >
            {isSaving ? 'Saving...' : '💾 Save Animal'}
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
