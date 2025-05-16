// src/lib/firebase.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, type Firestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBhi8uCEBHanjs7WkSnaECquaZRe9HqD6Y', // IMPORTANT: Replace with your actual API key
  authDomain: 'transport-erp-92997.firebaseapp.com',
  projectId: 'transport-erp-92997',
  storageBucket: 'transport-erp-92997.appspot.com', // Corrected .appspot.com for storageBucket
  messagingSenderId: '125345925810',
  appId: '1:125345925810:web:9c17709faf023f6bf797ab',
  measurementId: 'G-T83QKW2YR3'
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Fallback or error handling for app and db if initialization fails
  // For example, you might throw the error or set them to null
  // For now, we'll let the error propagate if critical, or log and continue if some parts can work without it.
  // Depending on how firebase is used elsewhere, this might need more robust handling.
  // throw error; // Or handle more gracefully
}


/**
 * Saves transport data to the 'transportes' collection in Cloud Firestore.
 * @param datosTransporte - An object containing the data for the transport document.
 * @returns {Promise<string | null>} The ID of the newly created document, or null if an error occurred.
 */
export const guardarTransporte = async (datosTransporte: Record<string, any>): Promise<string | null> => {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, 'transportes'), datosTransporte);
    console.log('Operación exitosa. Documento creado con ID:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error al agregar documento a Firestore:', e);
    return null;
  }
};

// Export db instance for use in other parts of the application
export { app, db };
