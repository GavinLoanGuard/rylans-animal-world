// ============================================
// Animals Page Component
// "My Stable" - Grid view of all animals
// ============================================

import { Animal } from '../types';
import styles from './AnimalsPage.module.css';

interface AnimalsPageProps {
  animals: Animal[];
  onDreamAnimal: () => void;
  onToyAnimal: () => void;
  onSelectAnimal: (animal: Animal) => void;
  onDeleteAnimal: (id: string) => void;
}

export function AnimalsPage({ 
  animals, 
  onDreamAnimal, 
  onToyAnimal,
  onSelectAnimal,
  onDeleteAnimal 
}: AnimalsPageProps) {
  return (
    <div className={styles.page}>
      {/* Create Buttons */}
      <div className={styles.createButtons}>
        <button className={`${styles.createButton} ${styles.dreamButton}`} onClick={onDreamAnimal}>
          <span className={styles.createIcon}>✨</span>
          <span className={styles.createText}>Dream Up Animal</span>
        </button>
        <button className={`${styles.createButton} ${styles.toyButton}`} onClick={onToyAnimal}>
          <span className={styles.createIcon}>📷</span>
          <span className={styles.createText}>Bring Toy to Life</span>
        </button>
      </div>

      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>🐴 My Stable</h2>
        <span className={styles.count}>{animals.length} animal{animals.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Animals Grid */}
      {animals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌾</div>
          <p className={styles.emptyText}>Your stable is empty!</p>
          <p className={styles.emptyHint}>Create your first animal to get started</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {animals.map((animal) => (
            <AnimalCard 
              key={animal.id} 
              animal={animal} 
              onSelect={() => onSelectAnimal(animal)}
              onDelete={() => onDeleteAnimal(animal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Animal Card Sub-component
interface AnimalCardProps {
  animal: Animal;
  onSelect: () => void;
  onDelete: () => void;
}

function AnimalCard({ animal, onSelect, onDelete }: AnimalCardProps) {
  const imageUrl = animal.portraitDataUrl || animal.stickerDataUrl;
  
  return (
    <div className={styles.card}>
      <button className={styles.cardMain} onClick={onSelect}>
        <div 
          className={styles.cardImage}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        >
          {!imageUrl && (
            <span className={styles.cardEmoji}>
              {getSpeciesEmoji(animal.species)}
            </span>
          )}
          {animal.mode === 'toy' && (
            <span className={styles.toyBadge}>📷</span>
          )}
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardName}>{animal.name}</h3>
          <p className={styles.cardSpecies}>{animal.species}</p>
          <div className={styles.cardColors}>
            <span 
              className={styles.colorDot} 
              style={{ backgroundColor: animal.colors.primary }}
            />
            {animal.colors.secondary && (
              <span 
                className={styles.colorDot} 
                style={{ backgroundColor: animal.colors.secondary }}
              />
            )}
          </div>
          <span className={styles.cardPersonality}>{animal.personality}</span>
        </div>
      </button>
      <button 
        className={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to remove ${animal.name} from your stable?`)) {
            onDelete();
          }
        }}
        aria-label={`Remove ${animal.name}`}
      >
        ×
      </button>
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
