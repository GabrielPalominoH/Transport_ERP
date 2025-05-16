
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
import { app as firebaseAppInstance, db as firestoreInstance } from '@/lib/firebase'; 


let auth: Auth;
if (firebaseAppInstance) {
  auth = getAuth(firebaseAppInstance);
} else {
  console.error("Firebase app is not initialized in firebase.ts. Auth features may not work.");
}

const CODIGO_MAESTRO_REGISTRO = "ALM2025"; 

interface AuthState {
  currentUser: Usuario | null; 
  firebaseUser: import('firebase/auth').User | null; 
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isListenerAttached: boolean; // New flag
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
  isListenerAttached: false, // Initialize flag
  clearError: () => set({ error: null }),

  initAuth: async () => {
    if (get().isListenerAttached || !auth) {
      if (!auth) console.warn("Auth service not available for initAuth.");
      if (get().isListenerAttached) console.log("Auth listener already attached.");
      // If no auth, ensure loading is false if it was true
      if (!auth && get().isLoading) set({ isLoading: false });
      return;
    }
    set({ isListenerAttached: true }); // Set flag
    
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        set({ firebaseUser: user, isAuthenticated: true, isLoading: true }); 

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
              // Attempt to create profile if missing for an authenticated user (e.g., if DB write failed during register)
              // This is optional and depends on desired behavior.
              // For now, we'll just log the warning.
            }
          } catch (firestoreErrorErr) {
            profileError = "Error al obtener el perfil de usuario desde Firestore.";
            console.error(profileError, firestoreErrorErr);
          }
        } else {
          profileError = "Firestore no inicializado, no se puede obtener el perfil completo del usuario.";
          console.error(profileError);
        }
        
        // Ensure currentUser is populated with at least basic Firebase Auth info
        const currentUserName = fetchedUserData.nombre || user.displayName || user.email || 'Usuario';

        set(state => ({
          ...state,
          currentUser: {
            id: user.uid,
            email: user.email || '',
            nombre: currentUserName,
            dni: fetchedUserData.dni || '',
          },
          isLoading: false, 
          error: state.error || profileError, 
        }));

      } else {
        set({ currentUser: null, firebaseUser: null, isAuthenticated: false, isLoading: false, error: null });
      }
    }, (errorListener) => {
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
        errorMessage = 'Error de configuración de Firebase Auth. Verifique la consola de Firebase y la configuración del proyecto (Email/Password provider debe estar habilitado).';
        console.error("Firebase Authentication (Email/Password) is likely not enabled in your Firebase project console, or your firebaseConfig (apiKey, authDomain) is incorrect.");
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMessage = 'El registro por correo y contraseña no está habilitado para este proyecto. Active Email/Password provider en la consola de Firebase.';
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
    set({isLoading: true});
    try {
      await signOut(auth);
    } catch (e:any) {
      console.error("Error during logout:", e);
      set({ error: e.message || 'Error al cerrar sesión.', isLoading: false }); 
    }
  },
}));

