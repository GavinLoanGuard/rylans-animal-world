// ============================================
// RYLAN'S ANIMAL STORY STUDIO - Main App
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { Page, Animal, Scene, Settings } from './types';
import {
  getAllAnimals,
  getAllScenes,
  getSettings,
  saveAnimal,
  deleteAnimal as dbDeleteAnimal,
  saveScene,
  deleteScene as dbDeleteScene,
  saveSettings,
} from './services/database';
import { launchConfetti } from './utils/confetti';

import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { AnimalsPage } from './components/AnimalsPage';
import { DreamAnimal } from './components/DreamAnimal';
import { ToyAnimal } from './components/ToyAnimal';
import { SceneMaker } from './components/SceneMaker';
import { StorybookPage } from './components/StorybookPage';
import { SceneViewer } from './components/SceneViewer';
import { ParentMode } from './components/ParentMode';

const DEFAULT_SETTINGS: Settings = {
  imageModel: 'dall-e-3',
  imageCount: 4,
  kidSafeMode: true,
  extraGentleMode: false,
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCreatedFirstAnimal, setHasCreatedFirstAnimal] = useState(false);
  const [hasCreatedFirstScene, setHasCreatedFirstScene] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedAnimals, loadedScenes, loadedSettings] = await Promise.all([
          getAllAnimals(),
          getAllScenes(),
          getSettings(),
        ]);
        setAnimals(loadedAnimals);
        setScenes(loadedScenes);
        setSettings(loadedSettings);
        if (loadedAnimals.length > 0) setHasCreatedFirstAnimal(true);
        if (loadedScenes.length > 0) setHasCreatedFirstScene(true);
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    setSelectedSceneId(null);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    switch (currentPage) {
      case 'dream-animal':
      case 'toy-animal':
        navigateTo('animals');
        break;
      case 'scene-viewer':
        navigateTo('storybook');
        break;
      case 'parent-mode':
        navigateTo('home');
        break;
      default:
        navigateTo('home');
    }
  }, [currentPage, navigateTo]);

  const handleSaveAnimal = useCallback(async (animal: Animal) => {
    await saveAnimal(animal);
    setAnimals(prev => [animal, ...prev.filter(a => a.id !== animal.id)]);
    if (!hasCreatedFirstAnimal) {
      setHasCreatedFirstAnimal(true);
      launchConfetti();
    }
    navigateTo('animals');
  }, [hasCreatedFirstAnimal, navigateTo]);

  const handleDeleteAnimal = useCallback(async (id: string) => {
    await dbDeleteAnimal(id);
    setAnimals(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSaveScene = useCallback(async (scene: Scene) => {
    await saveScene(scene);
    setScenes(prev => [scene, ...prev.filter(s => s.id !== scene.id)]);
    if (!hasCreatedFirstScene) {
      setHasCreatedFirstScene(true);
      launchConfetti();
    }
    navigateTo('storybook');
  }, [hasCreatedFirstScene, navigateTo]);

  const handleUpdateScene = useCallback(async (scene: Scene) => {
    await saveScene(scene);
    setScenes(prev => prev.map(s => s.id === scene.id ? scene : s));
  }, []);

  const handleDeleteScene = useCallback(async (id: string) => {
    await dbDeleteScene(id);
    setScenes(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleViewScene = useCallback((scene: Scene) => {
    setSelectedSceneId(scene.id);
    setCurrentPage('scene-viewer');
  }, []);

  const handleUpdateSettings = useCallback(async (newSettings: Settings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FDF6E9',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>🐴</div>
        <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.25rem', color: '#2D3436' }}>Loading your stable...</p>
      </div>
    );
  }

  const showBackButton = ['dream-animal', 'toy-animal', 'scene-viewer', 'animals', 'scene-maker', 'storybook', 'parent-mode'].includes(currentPage);
  const getPageTitle = () => {
    switch (currentPage) {
      case 'animals': return 'My Stable';
      case 'dream-animal': return 'Dream Up Animal';
      case 'toy-animal': return 'Bring Toy to Life';
      case 'scene-maker': return 'Create Scene';
      case 'storybook': return 'My Storybook';
      case 'scene-viewer': return 'View Scene';
      case 'parent-mode': return 'Parent Mode';
      default: return undefined;
    }
  };

  const selectedScene = selectedSceneId ? scenes.find(s => s.id === selectedSceneId) : null;

  return (
    <div className="page">
      <Header
        onParentMode={() => navigateTo('parent-mode')}
        showBack={showBackButton}
        onBack={goBack}
        title={getPageTitle()}
      />

      {currentPage === 'home' && (
        <HomePage
          onNavigate={(page) => navigateTo(page)}
          animalCount={animals.length}
          sceneCount={scenes.length}
        />
      )}

      {currentPage === 'animals' && (
        <AnimalsPage
          animals={animals}
          onDreamAnimal={() => navigateTo('dream-animal')}
          onToyAnimal={() => navigateTo('toy-animal')}
          onSelectAnimal={() => {}}
          onDeleteAnimal={handleDeleteAnimal}
        />
      )}

      {currentPage === 'dream-animal' && (
        <DreamAnimal
          settings={settings}
          onSave={handleSaveAnimal}
          onCancel={() => navigateTo('animals')}
        />
      )}

      {currentPage === 'toy-animal' && (
        <ToyAnimal
          onSave={handleSaveAnimal}
          onCancel={() => navigateTo('animals')}
        />
      )}

      {currentPage === 'scene-maker' && (
        <SceneMaker
          animals={animals}
          settings={settings}
          onSave={handleSaveScene}
          onCancel={() => navigateTo('home')}
          onNavigateToAnimals={() => navigateTo('animals')}
        />
      )}

      {currentPage === 'storybook' && (
        <StorybookPage
          scenes={scenes}
          animals={animals}
          onViewScene={handleViewScene}
          onDeleteScene={handleDeleteScene}
          onCreateScene={() => navigateTo('scene-maker')}
        />
      )}

      {currentPage === 'scene-viewer' && selectedScene && (
        <SceneViewer
          scene={selectedScene}
          animals={animals}
          onUpdate={handleUpdateScene}
          onClose={() => navigateTo('storybook')}
        />
      )}

      {currentPage === 'parent-mode' && (
        <ParentMode
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => navigateTo('home')}
        />
      )}
    </div>
  );
}

export default App;
