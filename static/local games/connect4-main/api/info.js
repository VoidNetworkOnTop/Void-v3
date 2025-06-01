// Firebase Configuration API Endpoint
// File: api/info.js

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyABlBYArBccjkQRhOo2rtJ5yP7gQ0tmTzw",
    authDomain: "connect4-eb06a.firebaseapp.com",
    projectId: "connect4-eb06a",
    storageBucket: "connect4-eb06a.firebasestorage.app",
    messagingSenderId: "169242213112",
    appId: "1:169242213112:web:1af850ad4a648b4d86590d"
  };

  res.status(200).json(firebaseConfig);
}