
// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Usuario } from '../interfaces/usuario';
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
  isListenerAttached: boolean; 
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
  isListenerAttached: false, 
  clearError: () => set({ error: null }),

  initAuth: async () => {
    if (get().isListenerAttached || !auth) {
      if (!auth) console.warn("Auth service not available for initAuth.");
      // if (get().isListenerAttached) console.debug("Auth listener already attached, skipping duplicate.");
      if (!auth && get().isLoading) set({ isLoading: false });
      return;
    }
    set({ isListenerAttached: true }); 
    // console.debug("Attaching Firebase Auth state listener."); 

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
            }
          } catch (firestoreErrorErr) {
            profileError = "Error al obtener el perfil de usuario desde Firestore.";
            console.error(profileError, firestoreErrorErr);
          }
        } else {
          profileError = "Firestore no inicializado, no se puede obtener el perfil completo del usuario.";
          console.error(profileError);
        }
        
        const currentUserNameFromAuth = user.displayName || user.email || 'Usuario';
        const currentUserName = fetchedUserData.nombre || currentUserNameFromAuth;
        const currentUserEmail = user.email || '';
        const currentUserDni = fetchedUserData.dni || '';

        set(state => ({
          ...state,
          currentUser: {
            id: user.uid,
            email: currentUserEmail,
            nombre: currentUserName,
            dni: currentUserDni,
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
      let displayError = 'Ocurrió un error al intentar iniciar sesión.';
      let isCommonAuthError = false;

      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        displayError = 'Correo electrónico o contraseña incorrectos. Por favor, verifique sus credenciales.';
        isCommonAuthError = true;
      } else if (e.code === 'auth/too-many-requests') {
        displayError = 'Se ha bloqueado el acceso debido a demasiados intentos fallidos. Inténtelo más tarde.';
        isCommonAuthError = true;
      } else if (e.code === 'auth/network-request-failed') {
        displayError = 'Error de red. Por favor, verifique su conexión a internet.';
        // For network errors, console.error is still appropriate.
      } else if (e.code === 'auth/invalid-email') {
        displayError = 'El formato del correo electrónico no es válido.';
        isCommonAuthError = true;
      }
      // Add other Firebase error codes as needed for specific user messages.

      if (isCommonAuthError) {
        console.warn(`Login attempt failed for email "${email}" - Code: ${e.code}. Firebase Message: ${e.message}. User will see: "${displayError}"`);
      } else if (e.code === 'auth/network-request-failed') {
        console.error(`Network error during login for email "${email}":`, e.code, e.message, e);
      } else {
        console.error(`Unexpected error during login for email "${email}":`, e.code, e.message, e);
      }
      
      set({ error: displayError, isLoading: false });
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
      
      set({ isLoading: false, error: null });
      return true; 
    } catch (e: any) {
      console.error("Error during registration:", e.code, e.message);
      let errorMessage = e.message || 'Error durante el registro.';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está registrado.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
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
    set({ isLoading: false });
  },
}));

