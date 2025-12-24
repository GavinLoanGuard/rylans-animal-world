// Vercel Serverless Function for Image Generation
// Supports Gemini (free/fast) and OpenAI DALL-E (paid/high quality)
// Set GEMINI_API_KEY for Gemini, OPENAI_API_KEY for OpenAI

export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

export default async function handler(request: Request) {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return new Response(
      JSON.stringify({ error: 'No API key configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, count = 1 } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try Gemini first (faster, free), fall back to OpenAI
    if (geminiKey) {
      const result = await generateWithGemini(prompt, geminiKey, Math.min(count, 4));
      if (result.success) {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log('Gemini failed, trying OpenAI...', result.error);
    }

    // Fall back to OpenAI
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

// Gemini image generation
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
          return { success: false, error: 'Rate limited - try again in a moment' };
        }
        if (response.status === 400) {
          const msg = (errorData as { error?: { message?: string } }).error?.message || '';
          if (msg.includes('safety')) {
            return { success: false, error: 'Content blocked - try different description' };
          }
        }
        // Continue to try OpenAI
        return { success: false, error: `Gemini error: ${response.status}` };
      }

      const data = await response.json();

      // Extract image from response
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

// OpenAI DALL-E image generation
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
        console.error('OpenAI error:', response.status, errorData);

        if (response.status === 401) {
          return { success: false, error: 'Invalid API key' };
        }
        if (response.status === 429) {
          return { success: false, error: 'Rate limited - try again in a moment' };
        }
        if (response.status === 400) {
          const msg = (errorData as { error?: { message?: string } }).error?.message || '';
          return { success: false, error: msg || 'Bad request' };
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
