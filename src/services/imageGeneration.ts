// ============================================
// Image Generation Service
// Uses Vercel serverless function exclusively
// ============================================

import { Animal, Location, Settings } from '../types';
import { buildKidSafePromptSuffix } from './contentFilter';

export interface ImageGenerationResult {
  success: boolean;
  images?: string[]; // base64 data URLs
  error?: string;
}

// Art style constant - cozy storybook watercolor
const ART_STYLE = `cozy children's storybook watercolor illustration, warm soft lighting, 
gentle pastel colors with pops of warmth, friendly inviting atmosphere, 
hand-painted feel with soft edges, magical dreamy quality, 
reminiscent of classic children's picture books`;

// Location descriptions for richer prompts
const LOCATION_DESCRIPTIONS: Record<Location, string> = {
  'Stable': 'a cozy wooden stable with hay bales, warm lantern light, and comfortable stalls',
  'Barn': 'a charming red barn with open doors, golden sunlight streaming in, rustic wooden beams',
  'Pasture': 'a lush green pasture with wildflowers, white wooden fences, and rolling hills',
  'Meadow': 'a beautiful wildflower meadow with butterflies, soft grass, and gentle sunshine',
  'Forest Trail': 'a magical forest trail with dappled sunlight through leaves, ferns, and mossy rocks',
  'Riding Arena': 'a well-kept riding arena with white fences, soft sandy ground, and blue sky',
  'Winter Field': 'a peaceful snowy field with gentle snowflakes, frost-covered fences, and cozy atmosphere',
  'River': 'a gentle babbling brook with smooth stones, willow trees, and sparkling water',
  'Mountain Path': 'a scenic mountain trail with wildflowers, pine trees, and distant peaks',
  'Cozy Farm': 'a charming farmyard with a cottage, vegetable garden, and friendly atmosphere',
};

// Build the complete prompt for scene generation
export function buildScenePrompt(
  animals: Animal[],
  location: Location,
  userDescription: string
): string {
  const animalDescriptions = animals.map((animal, index) => {
    const hasImage = animal.portraitDataUrl || animal.stickerDataUrl;
    const parts = [
      `${animal.name} the ${animal.species.toLowerCase()}`,
      hasImage ? ` (shown in reference image ${index + 1})` : '',
      !hasImage ? ` (${animal.colors.primary}` : '',
      !hasImage && animal.colors.secondary ? ` with ${animal.colors.secondary} markings` : '',
      !hasImage && animal.colors.markings ? `, ${animal.colors.markings}` : '',
      !hasImage ? `)` : '',
      `, who is ${animal.personality.toLowerCase()}`,
      animal.specialThing ? ` and ${animal.specialThing}` : '',
    ];
    return parts.join('');
  }).join('; ');

  const locationDesc = LOCATION_DESCRIPTIONS[location];
  
  const prompt = `${ART_STYLE}.

Scene setting: ${locationDesc}.

Characters: ${animalDescriptions}.

What's happening: ${userDescription}

IMPORTANT: Draw the characters to match the reference images provided. Keep their appearance consistent with the references.

${buildKidSafePromptSuffix()}`;

  return prompt;
}

// Build prompt for animal portrait
export function buildAnimalPortraitPrompt(animal: Animal): string {
  const colorDesc = animal.colors.secondary 
    ? `${animal.colors.primary} with ${animal.colors.secondary} markings`
    : animal.colors.primary;
  
  const markingsDesc = animal.colors.markings ? `, ${animal.colors.markings}` : '';
  
  const prompt = `${ART_STYLE}.

A friendly portrait of ${animal.name}, a ${animal.personality.toLowerCase()} ${animal.species.toLowerCase()}.

Color: ${colorDesc}${markingsDesc}.

${animal.specialThing ? `Special detail: ${animal.specialThing}.` : ''}

The animal should have a warm, friendly expression and be looking at the viewer.
Centered composition with soft background.

${buildKidSafePromptSuffix()}`;

  return prompt;
}

// Get reference images from animals (portraits or stickers)
function getAnimalImages(animals: Animal[]): string[] {
  return animals
    .map(animal => animal.portraitDataUrl || animal.stickerDataUrl)
    .filter((img): img is string => !!img);
}

// ============================================
// Main Generate Function - Server Only
// ============================================
export async function generateImages(
  prompt: string,
  _settings: Settings,
  count: number = 4,
  referenceImages?: string[]
): Promise<ImageGenerationResult> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        count,
        referenceImages: referenceImages || []
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', response.status, data);
      return {
        success: false,
        error: friendlyError(data.error || `Error ${response.status}`),
      };
    }

    if (!data.images || data.images.length === 0) {
      return {
        success: false,
        error: 'No images were created. Let\'s try again! 🔄',
      };
    }

    return {
      success: true,
      images: data.images,
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return {
      success: false,
      error: 'Could not connect to the server. Check your internet! 🌐',
    };
  }
}

// Convert technical errors to kid-friendly messages
function friendlyError(error: string): string {
  if (error.includes('Rate') || error.includes('rate') || error.includes('429')) {
    return 'Whoa, slow down! Wait a moment and try again ⏰';
  }
  if (error.includes('content') || error.includes('safety') || error.includes('policy')) {
    return 'Let\'s try describing something different! 🌈';
  }
  if (error.includes('API key') || error.includes('not configured') || error.includes('auth') || error.includes('401')) {
    return 'Oops! Something\'s not set up right. Ask Uncle Gavin! 🔧';
  }
  if (error.includes('billing') || error.includes('quota') || error.includes('403')) {
    return 'The magic machine needs more fuel! Ask Uncle Gavin 🔧';
  }
  return 'Something went wrong. Let\'s try again! 🔄';
}

// Generate a single animal portrait
export async function generateAnimalPortrait(
  animal: Animal,
  settings: Settings
): Promise<ImageGenerationResult> {
  const prompt = buildAnimalPortraitPrompt(animal);
  return generateImages(prompt, settings, 1);
}

// Generate scene images with reference images from animals
export async function generateSceneImages(
  animals: Animal[],
  location: Location,
  description: string,
  settings: Settings
): Promise<ImageGenerationResult & { promptUsed: string }> {
  const prompt = buildScenePrompt(animals, location, description);
  const referenceImages = getAnimalImages(animals);
  const result = await generateImages(prompt, settings, settings.imageCount, referenceImages);
  return {
    ...result,
    promptUsed: prompt,
  };
}
