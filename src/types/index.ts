// ============================================
// RYLAN'S ANIMAL STORY STUDIO - Type Definitions
// ============================================

export type AnimalMode = 'dream' | 'toy';

export type Species = 
  | 'Horse' 
  | 'Cow' 
  | 'Pig' 
  | 'Sheep' 
  | 'Chicken' 
  | 'Cat' 
  | 'Dog' 
  | 'Goat'
  | 'Bunny'
  | 'Duck'
  | 'Other';

export type Personality = 
  | 'Brave' 
  | 'Kind' 
  | 'Silly' 
  | 'Curious' 
  | 'Calm'
  | 'Adventurous'
  | 'Gentle'
  | 'Playful';

export type Location = 
  | 'Stable'
  | 'Barn'
  | 'Pasture'
  | 'Meadow'
  | 'Forest Trail'
  | 'Riding Arena'
  | 'Winter Field'
  | 'River'
  | 'Mountain Path'
  | 'Cozy Farm';

export interface AnimalColors {
  primary: string;
  secondary: string;
  markings?: string;
}

export interface Animal {
  id: string;
  createdAt: number;
  mode: AnimalMode;
  name: string;
  species: Species;
  personality: Personality;
  colors: AnimalColors;
  specialThing?: string;
  stickerDataUrl?: string;
  portraitDataUrl?: string;
}

export interface Scene {
  id: string;
  createdAt: number;
  title: string;
  location: Location;
  animalIds: string[];
  userDescription: string;
  promptUsed: string;
  imageDataUrls: string[];
  chosenImageDataUrl?: string;
  caption?: string;
  voiceNoteDataUrl?: string;
}

export interface Settings {
  openaiApiKey?: string;
  imageModel: string;
  imageCount: number;
  kidSafeMode: boolean;
  extraGentleMode: boolean;
}

export interface AppState {
  currentPage: Page;
  animals: Animal[];
  scenes: Scene[];
  settings: Settings;
}

export type Page = 
  | 'home'
  | 'animals'
  | 'dream-animal'
  | 'toy-animal'
  | 'scene-maker'
  | 'storybook'
  | 'scene-viewer'
  | 'parent-mode';

// For navigation with params
export interface NavigationState {
  page: Page;
  params?: {
    sceneId?: string;
    animalId?: string;
  };
}

// Daily spark prompts
export interface DailySpark {
  text: string;
  emoji: string;
}
