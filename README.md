# 🐴 Rylan's Animal Story Studio

A magical, kid-safe creative app for creating animal characters and generating AI-illustrated storybook scenes. Built as a Christmas gift for Rylan (age 9.5).

## ✨ Features

- **Create Animals** - Dream up new animals with custom colors, personalities, and traits, OR take photos of real toys to bring them to life as digital stickers
- **Voice Input** - Tap the 🎤 to speak instead of type!
- **Scene Maker** - Select your animals, choose a location, describe what's happening, and generate beautiful storybook-style illustrations
- **My Storybook** - Save your favorite scenes, add captions, and record voice narrations
- **Kid-Safe** - Built-in content filtering ensures all prompts and outputs are appropriate
- **Local-First** - All data stored in browser, no account required

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rylans-story-studio.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Import Project" → select your repo
3. **Add Environment Variable:**
   - Click "Environment Variables"
   - **Option A - Gemini (Free!):** 
     - Name: `GEMINI_API_KEY`
     - Value: Get free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - **Option B - OpenAI (Paid, higher quality):**
     - Name: `OPENAI_API_KEY`  
     - Value: Your OpenAI API key (starts with `sk-`)
   - **Pro tip:** Add BOTH keys - it tries Gemini first, falls back to OpenAI if needed
4. Click **Deploy**

### Step 3: Share the URL
Give Rylan the URL (e.g., `rylans-story-studio.vercel.app`) - she doesn't need to do anything else!

## 💰 Cost Estimate
- **Gemini:** FREE (with generous limits)
- **DALL-E 3:** ~$0.04-0.08 per image (~$0.20-0.30 per scene)

## 🔧 Local Development

```bash
npm install
npm run dev
```

For local testing with image generation, create a `.env.local` file:
```
OPENAI_API_KEY=sk-your-key-here
```

## 📱 Platform Support

- ✅ iPad Safari (primary target)
- ✅ iPhone Safari  
- ✅ Desktop Chrome/Firefox/Safari

## 🔒 Safety Features

- Content filtering blocks scary, violent, or inappropriate themes
- "Extra Gentle Mode" for even stricter filtering (in Settings)
- No external links, ads, or social features
- All data stored locally on device
- API key stored securely on Vercel (not in browser)

## 🛠️ Tech Stack

- React 18 + TypeScript + Vite
- Vercel Edge Functions (serverless API)
- IndexedDB for local storage
- OpenAI DALL-E 3 for images
- Web Speech API for voice input

## 💝 Made With Love

Built for Rylan's 2024 Christmas present!
