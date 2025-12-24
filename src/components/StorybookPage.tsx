// ============================================
// Storybook Page Component
// Grid of saved scenes
// ============================================

import { Scene, Animal } from '../types';
import styles from './StorybookPage.module.css';

interface StorybookPageProps {
  scenes: Scene[];
  animals: Animal[];
  onViewScene: (scene: Scene) => void;
  onDeleteScene: (id: string) => void;
  onCreateScene: () => void;
}

export function StorybookPage({ 
  scenes, 
  animals,
  onViewScene, 
  onDeleteScene,
  onCreateScene 
}: StorybookPageProps) {
  // Helper to get animal names for a scene
  const getAnimalNames = (animalIds: string[]): string => {
    return animalIds
      .map(id => animals.find(a => a.id === id)?.name || 'Unknown')
      .join(', ');
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>📖 My Storybook</h2>
        <span className={styles.count}>
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty State */}
      {scenes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📚</div>
          <h3 className={styles.emptyTitle}>Your Storybook is Empty</h3>
          <p className={styles.emptyText}>
            Create your first scene and it will appear here!
          </p>
          <button className={styles.createButton} onClick={onCreateScene}>
            🎨 Create a Scene
          </button>
        </div>
      ) : (
        <>
          {/* Scenes Grid */}
          <div className={styles.grid}>
            {scenes.map((scene) => (
              <div key={scene.id} className={styles.card}>
                <button 
                  className={styles.cardMain}
                  onClick={() => onViewScene(scene)}
                >
                  <div 
                    className={styles.cardImage}
                    style={{ 
                      backgroundImage: scene.chosenImageDataUrl 
                        ? `url(${scene.chosenImageDataUrl})` 
                        : undefined 
                    }}
                  >
                    {!scene.chosenImageDataUrl && (
                      <span className={styles.cardPlaceholder}>🖼️</span>
                    )}
                    {scene.voiceNoteDataUrl && (
                      <span className={styles.voiceBadge}>🎤</span>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{scene.title}</h3>
                    <p className={styles.cardAnimals}>
                      {getAnimalNames(scene.animalIds)}
                    </p>
                    <span className={styles.cardLocation}>
                      📍 {scene.location}
                    </span>
                  </div>
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove this scene from your storybook?`)) {
                      onDeleteScene(scene.id);
                    }
                  }}
                  aria-label="Delete scene"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <div className={styles.addMore}>
            <button className={styles.addButton} onClick={onCreateScene}>
              + Add Another Scene
            </button>
          </div>
        </>
      )}
    </div>
  );
}
