// Firebase Configuration and Initialization
// File: js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Variables to store Firebase instances
let app;
let db;
let firebaseConfig;

// Function to fetch Firebase configuration from API
async function fetchFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  try {
    const response = await fetch('/api/info');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    firebaseConfig = await response.json();
    return firebaseConfig;
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    throw error;
  }
}

// Initialize Firebase with config from API
export async function initializeFirebase() {
  if (!app) {
    try {
      const config = await fetchFirebaseConfig();
      app = initializeApp(config);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }
  return app;
}

// Function to get database instance (ensures Firebase is initialized)
export async function getDatabase() {
  if (!db) {
    await initializeFirebase();
  }
  return db;
}

// Export the database instance (will be undefined until initialized)
export { db };

// Export the app instance (will be undefined until initialized)
export { app };