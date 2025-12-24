// ============================================
// Kid-Safe Content Filter
// Ensures all generated content is appropriate for ages 8-11
// ============================================

// Words and phrases that should be blocked in user input
const BLOCKED_TERMS = [
  // Violence
  'kill', 'killing', 'dead', 'death', 'die', 'dying', 'murder', 'blood', 'bloody',
  'weapon', 'gun', 'knife', 'sword', 'fight', 'fighting', 'war', 'battle',
  'hurt', 'attack', 'attacking', 'destroy', 'explosion', 'bomb',
  
  // Scary
  'scary', 'horror', 'monster', 'demon', 'devil', 'evil', 'nightmare', 'haunted',
  'ghost', 'zombie', 'vampire', 'skeleton', 'creepy', 'terrifying', 'frightening',
  
  // Inappropriate
  'naked', 'nude', 'sexy', 'kiss', 'kissing', 'romantic', 'love', 'dating',
  'boyfriend', 'girlfriend', 'married', 'wedding',
  
  // Negative emotions (when excessive)
  'hate', 'hating', 'angry', 'furious', 'rage', 'crying', 'sad', 'depressed',
  
  // Substances
  'alcohol', 'beer', 'wine', 'drunk', 'smoke', 'smoking', 'drugs',
];

// Friendly replacement suggestions
const GENTLE_ALTERNATIVES: Record<string, string> = {
  'scary': 'exciting',
  'fight': 'play',
  'fighting': 'playing',
  'angry': 'grumpy',
  'sad': 'a little blue',
  'crying': 'feeling emotional',
  'hurt': 'bumped',
};

export interface ContentCheckResult {
  isAllowed: boolean;
  friendlyMessage?: string;
  cleanedText?: string;
}

export function checkContent(text: string, extraGentleMode: boolean = false): ContentCheckResult {
  const lowerText = text.toLowerCase();
  
  // Check for blocked terms
  for (const term of BLOCKED_TERMS) {
    if (lowerText.includes(term)) {
      // In extra gentle mode, provide alternatives if available
      if (extraGentleMode && GENTLE_ALTERNATIVES[term]) {
        return {
          isAllowed: false,
          friendlyMessage: `Oops! Let's use friendlier words. Instead of "${term}", how about "${GENTLE_ALTERNATIVES[term]}"? 🌟`,
        };
      }
      
      return {
        isAllowed: false,
        friendlyMessage: `Hmm, let's keep our stories happy and friendly! Try describing something nice that could happen instead. 🌈`,
      };
    }
  }

  // Additional checks for extra gentle mode
  if (extraGentleMode) {
    // Check for any negative-sounding phrases
    const mildlyNegative = ['lost', 'alone', 'dark', 'storm', 'thunder'];
    for (const term of mildlyNegative) {
      if (lowerText.includes(term)) {
        return {
          isAllowed: true,
          friendlyMessage: `That sounds like an adventure! Remember, everything turns out okay in the end! ✨`,
          cleanedText: text,
        };
      }
    }
  }

  return {
    isAllowed: true,
    cleanedText: text,
  };
}

// Build the kid-safe prompt modifier
export function buildKidSafePromptSuffix(): string {
  return `
IMPORTANT STYLE REQUIREMENTS:
- Cozy, warm, and friendly atmosphere
- Soft, inviting colors with gentle lighting
- All animals have happy, friendly expressions
- Safe, wholesome environment suitable for children
- Storybook illustration style with a magical, dreamy quality
- No scary, violent, or inappropriate elements
- Everything feels safe, warm, and welcoming`;
}

// Validate animal name
export function validateAnimalName(name: string): ContentCheckResult {
  if (!name || name.trim().length === 0) {
    return {
      isAllowed: false,
      friendlyMessage: "Every animal needs a name! What would you like to call them? 🐴",
    };
  }

  if (name.length > 30) {
    return {
      isAllowed: false,
      friendlyMessage: "That's a very long name! Can you make it a bit shorter? 📝",
    };
  }

  return checkContent(name);
}

// Validate scene description
export function validateSceneDescription(description: string): ContentCheckResult {
  if (!description || description.trim().length === 0) {
    return {
      isAllowed: false,
      friendlyMessage: "Tell us what's happening in your scene! What are your animals doing? 🎬",
    };
  }

  if (description.length > 500) {
    return {
      isAllowed: false,
      friendlyMessage: "Wow, that's a lot of story! Try to describe the main thing happening in a shorter way. 📖",
    };
  }

  return checkContent(description);
}
