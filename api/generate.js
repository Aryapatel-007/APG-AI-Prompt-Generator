// api/generate.js - Final version using the stable Google Gemini 1.0 Pro model

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, systemInstruction } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  // IMPORTANT: The environment variable must be named GEMINI_API_KEY
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  // *** Using the stable Gemini 1.0 Pro model as requested ***
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    // Conditionally add system instructions if they exist
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
  };

  try {
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY, // The key goes in the header
      },
      body: JSON.stringify(payload),
    });

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Gemini API.';
      return res.status(geminiResponse.status).json({ error: message, upstream: responseData });
    }

    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string') {
      return res.status(200).json({ text });
    } else {
      console.error('Could not extract text from Gemini response:', responseData);
      return res.status(500).json({ error: 'Could not extract text from the AI response.' });
    }

  } catch (error) {
    console.error('Internal Serverless Function Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

