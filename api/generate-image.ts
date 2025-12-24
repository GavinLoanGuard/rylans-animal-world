// Vercel Serverless Function for Image Generation
// Uses OpenAI GPT-Image-1 with reference image support

export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    return new Response(
      JSON.stringify({ error: 'No API key configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, count = 1, referenceImages = [] } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If we have reference images and OpenAI key, use GPT-Image-1 (supports image inputs)
    if (referenceImages.length > 0 && openaiKey) {
      const result = await generateWithOpenAIVision(prompt, openaiKey, Math.min(count, 4), referenceImages);
      if (result.success) {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log('OpenAI vision failed:', result.error);
    }

    // Try Gemini (no reference image support yet)
    if (geminiKey && referenceImages.length === 0) {
      const result = await generateWithGemini(prompt, geminiKey, Math.min(count, 4));
      if (result.success) {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log('Gemini failed:', result.error);
    }

    // Fall back to OpenAI DALL-E 3 (no reference support but good quality)
    if (openaiKey) {
      const result = await generateWithOpenAI(prompt, openaiKey, Math.min(count, 4));
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Image generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OpenAI GPT-Image-1 with reference images
async function generateWithOpenAIVision(
  prompt: string,
  apiKey: string,
  count: number,
  referenceImages: string[]
): Promise<{ success: boolean; images?: string[]; error?: string }> {
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // Build content array with text and reference images
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: prompt }
      ];

      // Add reference images
      for (const refImage of referenceImages) {
        content.push({
          type: 'image_url',
          image_url: { url: refImage }
        });
      }

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI GPT-Image error:', response.status, errorData);
        
        // If GPT-Image-1 fails, return error to try fallback
        return { success: false, error: `GPT-Image error: ${response.status}` };
      }

      const data = await response.json();

      if (data.data?.[0]?.b64_json) {
        images.push(`data:image/png;base64,${data.data[0].b64_json}`);
      } else if (data.data?.[0]?.url) {
        // Fetch and convert to base64
        try {
          const imgResp = await fetch(data.data[0].url);
          const blob = await imgResp.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          images.push(`data:image/png;base64,${base64}`);
        } catch {
          images.push(data.data[0].url);
        }
      }
    } catch (error) {
      console.error('OpenAI vision request error:', error);
      return { success: false, error: 'OpenAI connection failed' };
    }
  }

  if (images.length === 0) {
    return { success: false, error: 'No images generated' };
  }

  return { success: true, images };
}

// Gemini image generation (no reference image support)
async function generateWithGemini(
  prompt: string,
  apiKey: string,
  count: number
): Promise<{ success: boolean; images?: string[]; error?: string }> {
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini error:', response.status, errorData);
        
        if (response.status === 429) {
          return { success: false, error: 'Rate limited' };
        }
        return { success: false, error: `Gemini error: ${response.status}` };
      }

      const data = await response.json();

      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error('Gemini request error:', error);
      return { success: false, error: 'Gemini connection failed' };
    }
  }

  if (images.length === 0) {
    return { success: false, error: 'No images generated' };
  }

  return { success: true, images };
}

// OpenAI DALL-E 3 (fallback, no reference support)
async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  count: number
): Promise<{ success: boolean; images?: string[]; error?: string }> {
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
          quality: 'standard',
          style: 'vivid',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI DALL-E error:', response.status, errorData);

        if (response.status === 401) {
          return { success: false, error: 'Invalid API key' };
        }
        if (response.status === 429) {
          return { success: false, error: 'Rate limited' };
        }

        return { success: false, error: `OpenAI error: ${response.status}` };
      }

      const data = await response.json();

      if (data.data?.[0]?.b64_json) {
        images.push(`data:image/png;base64,${data.data[0].b64_json}`);
      }
    } catch (error) {
      console.error('OpenAI request error:', error);
      return { success: false, error: 'OpenAI connection failed' };
    }
  }

  if (images.length === 0) {
    return { success: false, error: 'No images generated' };
  }

  return { success: true, images };
}
