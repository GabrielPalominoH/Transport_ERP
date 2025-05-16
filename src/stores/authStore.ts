// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Usuario } from '../interfaces/usuario';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type Auth,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { app as firebaseAppInstance, db as firestoreInstance } from '@/lib/firebase'; // Use existing initialized app and db


// Ensure Firebase app is initialized (especially for auth)
// This might be redundant if firebase.ts already does this robustly,
// but auth operations often need getAuth() called after initializeApp().
let auth: Auth;
if (firebaseAppInstance) {
  auth = getAuth(firebaseAppInstance);
} else {
  console.error("Firebase app is not initialized in firebase.ts. Auth features may not work.");
  // Potentially initialize a local instance if absolutely necessary, though it's better to rely on the central one.
}

const CODIGO_MAESTRO_REGISTRO = "ALM2025"; 

interface AuthState {
  currentUser: Usuario | null; // Stores { uid, nombre, dni, email (from Firebase Auth) }
  firebaseUser: import('firebase/auth').User | null; // Raw Firebase user object
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>; 
  login: (email: string, clave: string) => Promise<boolean>;
  register: (nombre: string, dni: string, email: string, clave: string, codigoMaestro: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true, 
  error: null,
  clearError: () => set({ error: null }),

  initAuth: async () => {
    if (!auth) {
        console.warn("Auth service not available for initAuth.");
        set({ isLoading: false });
        return;
    }
    set({ isLoading: true });
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, now fetch additional user data from Firestore
        if (!firestoreInstance) {
            console.error("Firestore not initialized, cannot fetch user details.");
            set({ firebaseUser: user, currentUser: null, isAuthenticated: true, isLoading: false, error: "Failed to load user profile." });
            return;
        }
        const userDocRef = doc(firestoreInstance, "usuarios", user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const userData = docSnap.data() as Omit<Usuario, 'id'>; // id is uid from auth
              set({ 
                firebaseUser: user, 
                currentUser: { id: user.uid, email: user.email!, ...userData }, 
                isAuthenticated: true, 
                isLoading: false 
              });
            } else {
              // This case might happen if Firestore document wasn't created or was deleted
              console.warn("User document not found in Firestore for UID:", user.uid);
              set({ firebaseUser: user, currentUser: {id: user.uid, nombre: user.displayName || user.email!, dni: '', email: user.email! }, isAuthenticated: true, isLoading: false, error: "User profile incomplete." });
            }
        } catch (firestoreError) {
            console.error("Error fetching user document from Firestore:", firestoreError);
            set({ firebaseUser: user, currentUser: null, isAuthenticated: true, isLoading: false, error: "Error loading user profile." });
        }
      } else {
        // User is signed out
        set({ currentUser: null, firebaseUser: null, isAuthenticated: false, isLoading: false });
      }
    }, (error) => {
        // Handle errors from onAuthStateChanged itself
        console.error("Error in onAuthStateChanged listener:", error);
        set({ currentUser: null, firebaseUser: null, isAuthenticated: false, isLoading: false, error: "Session listener error." });
    });
  },

  login: async (email, clave) => {
    if (!auth) {
        set({ error: 'Servicio de autenticación no disponible.', isLoading: false });
        return false;
    }
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, clave);
      // onAuthStateChanged will handle setting user state
      // No need to explicitly call fetchUsers or saveCurrentUser here with Firebase Auth
      // If login is successful, initAuth's onAuthStateChanged callback will update the store.
      return true; 
    } catch (e: any) {
      console.error("Error during login:", e);
      set({ error: e.message || 'Email o contraseña incorrectos.', isLoading: false });
      return false;
    }
  },

  register: async (nombre, dni, email, clave, codigoMaestro) => {
    if (!auth || !firestoreInstance) {
      set({ error: 'Servicio de autenticación o base de datos no disponible.', isLoading: false });
      return false;
    }
    set({ isLoading: true, error: null });
    if (codigoMaestro !== CODIGO_MAESTRO_REGISTRO) {
      set({ error: 'Código maestro incorrecto.', isLoading: false });
      return false;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, clave);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile (optional, but good practice)
      await updateProfile(firebaseUser, { displayName: nombre });

      // Save additional user info to Firestore
      const userForFirestore: Omit<Usuario, 'id' | 'email'> = { nombre, dni }; // id is uid, email from auth
      await setDoc(doc(firestoreInstance, "usuarios", firebaseUser.uid), userForFirestore);
      
      // onAuthStateChanged will handle setting user state, or you can set it partially here
      // For now, let's assume onAuthStateChanged will pick it up.
      // If immediate update is needed:
      // set({ 
      //   firebaseUser: firebaseUser, 
      //   currentUser: { id: firebaseUser.uid, nombre, dni, email }, 
      //   isAuthenticated: true, 
      //   isLoading: false 
      // });
      set({ isLoading: false }); // Let onAuthStateChanged handle the full state update
      return true;
    } catch (e: any) {
      console.error("Error during registration:", e);
      // Check for specific Firebase error codes for better messages
      if (e.code === 'auth/email-already-in-use') {
        set({ error: 'El correo electrónico ya está registrado.', isLoading: false });
      } else if (e.code === 'auth/invalid-email') {
        set({ error: 'El correo electrónico no es válido.', isLoading: false });
      } else if (e.code === 'auth/weak-password') {
        set({ error: 'La contraseña es demasiado débil.', isLoading: false });
      }
      else {
        set({ error: e.message || 'Error durante el registro.', isLoading: false });
      }
      return false;
    }
  },

  logout: async () => {
    if (!auth) {
        set({ error: 'Servicio de autenticación no disponible.', isLoading: false });
        return;
    }
    set({isLoading: true});
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null
      set({ currentUser: null, firebaseUser: null, isAuthenticated: false, error: null, isLoading: false });
    } catch (e:any) {
      console.error("Error during logout:", e);
      set({ error: e.message || 'Error al cerrar sesión.', isLoading: false });
    }
  },
}));

// Ensure initAuth is called once when the store is created/app loads.
// This is typically done in a top-level component like _app.tsx or Layout.tsx
// For this setup, AuthInitializer.tsx handles this.
