// api/health.js - Simplified for Vercel build compatibility

// Use the standard arrow function export pattern
module.exports = (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Ensure only GET requests are processed
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Check if the environment variable is present on the server
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  // Return a success status with the check result
  return res.status(200).json({ 
    ok: true, 
    env: { 
      GEMINI_API_KEY: hasKey ? 'present' : 'missing' 
    } 
  });
};
