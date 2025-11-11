// api/health.js - Final version for Mistral API

module.exports = (req, res) => {
  // Set CORS headers
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

  // Check if the correct environment variable for Mistral is present
  const hasKey = Boolean(process.env.MISTRAL_API_KEY);

  // Return a success status with the check result
  return res.status(200).json({ 
    ok: true, 
    env: { 
      MISTRAL_API_KEY: hasKey ? 'present' : 'missing' 
    } 
  });
};