// ============================================
// Home Page Component
// Main landing page with navigation to key features
// ============================================

import { getDailySpark } from '../data/dailySparks';
import styles from './HomePage.module.css';

interface HomePageProps {
  onNavigate: (page: 'animals' | 'scene-maker' | 'storybook') => void;
  animalCount: number;
  sceneCount: number;
}

export function HomePage({ onNavigate, animalCount, sceneCount }: HomePageProps) {
  const dailySpark = getDailySpark();

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroEmoji}>🌟</div>
        <h2 className={styles.heroTitle}>Welcome to Your Story Studio!</h2>
        <p className={styles.heroSubtitle}>Create amazing animal adventures</p>
      </div>

      {/* Daily Spark */}
      <div className={styles.spark}>
        <div className={styles.sparkIcon}>{dailySpark.emoji}</div>
        <div className={styles.sparkContent}>
          <span className={styles.sparkLabel}>Today's Story Spark</span>
          <p className={styles.sparkText}>{dailySpark.text}</p>
        </div>
      </div>

      {/* Main Navigation Buttons */}
      <div className={styles.mainButtons}>
        <button 
          className={`${styles.navButton} ${styles.animalsButton}`}
          onClick={() => onNavigate('animals')}
        >
          <div className={styles.buttonIcon}>🐴</div>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Create an Animal</span>
            <span className={styles.buttonSubtitle}>
              {animalCount === 0 
                ? "Start your stable!" 
                : `${animalCount} animal${animalCount !== 1 ? 's' : ''} in your stable`}
            </span>
          </div>
          <div className={styles.buttonArrow}>→</div>
        </button>

        <button 
          className={`${styles.navButton} ${styles.sceneButton}`}
          onClick={() => onNavigate('scene-maker')}
        >
          <div className={styles.buttonIcon}>🎨</div>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Create a Scene</span>
            <span className={styles.buttonSubtitle}>
              {animalCount === 0 
                ? "Create animals first!" 
                : "Make magic happen!"}
            </span>
          </div>
          <div className={styles.buttonArrow}>→</div>
        </button>

        <button 
          className={`${styles.navButton} ${styles.storybookButton}`}
          onClick={() => onNavigate('storybook')}
        >
          <div className={styles.buttonIcon}>📖</div>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>My Storybook</span>
            <span className={styles.buttonSubtitle}>
              {sceneCount === 0 
                ? "Your adventures await!" 
                : `${sceneCount} scene${sceneCount !== 1 ? 's' : ''} saved`}
            </span>
          </div>
          <div className={styles.buttonArrow}>→</div>
        </button>
      </div>

      {/* Fun fact footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          ✨ Tip: Take photos of your toy animals to bring them to life!
        </p>
      </div>
    </div>
  );
}
