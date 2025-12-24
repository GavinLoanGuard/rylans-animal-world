// ============================================
// IndexedDB Database Service
// Local-first storage for animals, scenes, and settings
// ============================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Animal, Scene, Settings } from '../types';

interface StoryStudioDB extends DBSchema {
  animals: {
    key: string;
    value: Animal;
    indexes: { 'by-created': number };
  };
  scenes: {
    key: string;
    value: Scene;
    indexes: { 'by-created': number };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'rylans-story-studio';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<StoryStudioDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<StoryStudioDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StoryStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Animals store
      if (!db.objectStoreNames.contains('animals')) {
        const animalStore = db.createObjectStore('animals', { keyPath: 'id' });
        animalStore.createIndex('by-created', 'createdAt');
      }

      // Scenes store
      if (!db.objectStoreNames.contains('scenes')) {
        const sceneStore = db.createObjectStore('scenes', { keyPath: 'id' });
        sceneStore.createIndex('by-created', 'createdAt');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

// ============================================
// Animal Operations
// ============================================

export async function getAllAnimals(): Promise<Animal[]> {
  const db = await getDB();
  const animals = await db.getAllFromIndex('animals', 'by-created');
  return animals.reverse(); // Newest first
}

export async function getAnimal(id: string): Promise<Animal | undefined> {
  const db = await getDB();
  return db.get('animals', id);
}

export async function saveAnimal(animal: Animal): Promise<void> {
  const db = await getDB();
  await db.put('animals', animal);
}

export async function deleteAnimal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('animals', id);
}

// ============================================
// Scene Operations
// ============================================

export async function getAllScenes(): Promise<Scene[]> {
  const db = await getDB();
  const scenes = await db.getAllFromIndex('scenes', 'by-created');
  return scenes.reverse(); // Newest first
}

export async function getScene(id: string): Promise<Scene | undefined> {
  const db = await getDB();
  return db.get('scenes', id);
}

export async function saveScene(scene: Scene): Promise<void> {
  const db = await getDB();
  await db.put('scenes', scene);
}

export async function deleteScene(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('scenes', id);
}

// ============================================
// Settings Operations
// ============================================

const DEFAULT_SETTINGS: Settings = {
  imageModel: 'dall-e-3',
  imageCount: 4,
  kidSafeMode: true,
  extraGentleMode: false,
};

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'main');
}

// ============================================
// Export / Import Operations
// ============================================

export interface ExportData {
  version: number;
  exportedAt: string;
  animals: Animal[];
  scenes: Scene[];
  settings: Settings;
}

export async function exportAllData(): Promise<ExportData> {
  const animals = await getAllAnimals();
  const scenes = await getAllScenes();
  const settings = await getSettings();

  // Remove API key from export for safety
  const safeSettings = { ...settings, openaiApiKey: undefined };

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    animals,
    scenes,
    settings: safeSettings,
  };
}

export async function importAllData(data: ExportData): Promise<void> {
  const db = await getDB();

  // Import animals
  const animalTx = db.transaction('animals', 'readwrite');
  for (const animal of data.animals) {
    await animalTx.store.put(animal);
  }
  await animalTx.done;

  // Import scenes
  const sceneTx = db.transaction('scenes', 'readwrite');
  for (const scene of data.scenes) {
    await sceneTx.store.put(scene);
  }
  await sceneTx.done;

  // Import settings (preserve existing API key)
  const existingSettings = await getSettings();
  const newSettings = {
    ...data.settings,
    openaiApiKey: existingSettings.openaiApiKey, // Keep existing key
  };
  await saveSettings(newSettings);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  
  const animalTx = db.transaction('animals', 'readwrite');
  await animalTx.store.clear();
  await animalTx.done;

  const sceneTx = db.transaction('scenes', 'readwrite');
  await sceneTx.store.clear();
  await sceneTx.done;

  const settingsTx = db.transaction('settings', 'readwrite');
  await settingsTx.store.clear();
  await settingsTx.done;
}
