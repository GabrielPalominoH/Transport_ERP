
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
    // No need to set isLoading: true here if it's already true by default
    // and onAuthStateChanged will manage it.
    
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in via Firebase Auth
        set({ firebaseUser: user, isAuthenticated: true, isLoading: true }); // isLoading to true while fetching profile

        let fetchedUserData: Partial<Omit<Usuario, 'id' | 'email'>> = {};
        let profileError: string | null = null;

        if (firestoreInstance) {
          const userDocRef = doc(firestoreInstance, "usuarios", user.uid);
          try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const firestoreData = docSnap.data() as Omit<Usuario, 'id' | 'email'>;
              fetchedUserData = { nombre: firestoreData.nombre, dni: firestoreData.dni };
            } else {
              profileError = "Documento de perfil de usuario no encontrado en Firestore.";
              console.warn(profileError, user.uid);
            }
          } catch (firestoreErrorErr) {
            profileError = "Error al obtener el perfil de usuario desde Firestore.";
            console.error(profileError, firestoreErrorErr);
          }
        } else {
          profileError = "Firestore no inicializado, no se puede obtener el perfil completo del usuario.";
          console.error(profileError);
        }

        set(state => ({
          ...state, // Keep existing state like firebaseUser, isAuthenticated
          currentUser: {
            id: user.uid,
            email: user.email || '',
            nombre: fetchedUserData.nombre || user.displayName || user.email || 'Usuario', // Fallback logic for name
            dni: fetchedUserData.dni || '',
          },
          isLoading: false, // Auth process (including profile fetch) is complete
          error: state.error || profileError, // Preserve existing auth errors or set new profile-related error
        }));

      } else {
        // User is signed out
        set({ currentUser: null, firebaseUser: null, isAuthenticated: false, isLoading: false, error: null });
      }
    }, (errorListener) => {
        // Handle errors from onAuthStateChanged itself
        console.error("Error en el listener de onAuthStateChanged:", errorListener);
        set({ currentUser: null, firebaseUser: null, isAuthenticated: false, isLoading: false, error: "Error en el listener de sesión." });
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
      // onAuthStateChanged will handle setting user state.
      // isLoading will be set to false by onAuthStateChanged when done.
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

      await updateProfile(firebaseUser, { displayName: nombre });

      const userForFirestore: Omit<Usuario, 'id' | 'email'> = { nombre, dni };
      await setDoc(doc(firestoreInstance, "usuarios", firebaseUser.uid), userForFirestore);
      
      // onAuthStateChanged will handle the full state update, including setting isLoading to false.
      // No need to set isLoading: false here directly as onAuthStateChanged will fire.
      return true;
    } catch (e: any) {
      console.error("Error during registration:", e);
      let errorMessage = e.message || 'Error durante el registro.';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está registrado.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil.';
      } else if (e.code === 'auth/configuration-not-found') {
        errorMessage = 'Error de configuración de Firebase Auth. Verifique la consola de Firebase y la configuración del proyecto.';
        console.error("Firebase Authentication (Email/Password) is likely not enabled in your Firebase project console, or your firebaseConfig (apiKey, authDomain) is incorrect.");
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMessage = 'El registro por correo y contraseña no está habilitado para este proyecto. Contacte al administrador.';
        console.error("Email/Password sign-in is not enabled in the Firebase console. Go to Firebase console -> Authentication -> Sign-in method and enable Email/Password.");
      }
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    if (!auth) {
        set({ error: 'Servicio de autenticación no disponible.', isLoading: false });
        return;
    }
    set({isLoading: true}); // isLoading true during logout process
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null, isAuthenticated to false, and isLoading to false.
    } catch (e:any) {
      console.error("Error during logout:", e);
      set({ error: e.message || 'Error al cerrar sesión.', isLoading: false }); // Ensure isLoading is false on error
    }
  },
}));
