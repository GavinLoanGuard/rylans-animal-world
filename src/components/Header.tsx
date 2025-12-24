// ============================================
// Header Component
// App header with logo and hidden Parent Mode access
// ============================================

import { useState, useRef } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  onParentMode: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export function Header({ onParentMode, showBack, onBack, title }: HeaderProps) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);

  // Handle taps for 5-tap unlock
  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Reset count after 2 seconds of no taps
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = window.setTimeout(() => {
      setTapCount(0);
    }, 2000);

    // 5 taps unlocks parent mode
    if (newCount >= 5) {
      setTapCount(0);
      onParentMode();
    }
  };

  // Handle long press for alternative unlock
  const handleLongPressStart = () => {
    longPressTimeoutRef.current = window.setTimeout(() => {
      onParentMode();
    }, 1500); // 1.5 second hold
  };

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {showBack && onBack ? (
          <button className={styles.backButton} onClick={onBack} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        ) : (
          <div className={styles.spacer} />
        )}

        <div 
          className={styles.logoContainer}
          onClick={handleLogoTap}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
        >
          {title ? (
            <h1 className={styles.pageTitle}>{title}</h1>
          ) : (
            <>
              <span className={styles.logo}>🐴</span>
              <h1 className={styles.title}>Rylan's Story Studio</h1>
            </>
          )}
        </div>

        <div className={styles.spacer} />
      </div>
    </header>
  );
}
