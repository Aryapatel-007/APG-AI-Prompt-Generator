// api/generate.js - Final version using the Gemini Pro model

// Use the standard async arrow function export pattern
module.exports = async (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1. Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel's environment automatically parses the JSON body
  const { prompt, systemInstruction } = req.body || {};

  // 2. Validate that the necessary inputs are present
  if (!prompt && !systemInstruction) {
    return res.status(400).json({ error: 'A prompt or system instruction is required.' });
  }

  // 3. Securely retrieve the API key from Vercel's environment variables
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  // 4. *** MODEL UPGRADE *** Use the correct, valid Gemini Pro model name
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt || '' }],
      },
    ],
    // Conditionally add system instructions if they exist
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
  };

  try {
    // 5. Make the fetch call with the API key in the headers
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY, // The key goes here
      },
      body: JSON.stringify(payload),
    });

    const responseData = await geminiResponse.json();

    // Handle errors from the Gemini API itself
    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Gemini API.';
      return res.status(geminiResponse.status).json({ error: message, upstream: responseData });
    }

    // 6. Safely extract the generated text from the successful response
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

