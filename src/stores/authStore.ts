"use client";

import { create } from 'zustand';
import type { Usuario } from '../interfaces/usuario';
import { v4 as uuidv4 } from 'uuid';

// SIMULACIÓN DE API DE AUTENTICACIÓN Y USUARIOS
// En un sistema real, esto interactuaría con un backend seguro.
// Las contraseñas NUNCA deben almacenarse en texto plano. Aquí es solo simulación.
interface StoredUser extends Usuario {
  clave: string; // Solo para simulación de la "base de datos" de usuarios
}

const simApiAuth = {
  fetchUsers: async (): Promise<StoredUser[]> => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('erp_users');
    return data ? JSON.parse(data) : [];
  },
  saveUsers: async (users: StoredUser[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('erp_users', JSON.stringify(users));
  },
  getCurrentUser: async (): Promise<Usuario | null> => { // Simula sesión persistente
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('erp_current_user');
    return data ? JSON.parse(data) : null;
  },
  saveCurrentUser: async (user: Usuario | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('erp_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('erp_current_user');
    }
  }
};

const CODIGO_MAESTRO_REGISTRO = "ALM2025"; // Hardcoded master code

interface AuthState {
  currentUser: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>; // Para cargar sesión al iniciar la app
  login: (nombre: string, clave: string) => Promise<boolean>;
  register: (nombre: string, dni: string, clave: string, codigoMaestro: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true, // Inicia como true hasta que initAuth se complete
  error: null,
  clearError: () => set({ error: null }),
  initAuth: async () => {
    set({ isLoading: true });
    try {
        const user = await simApiAuth.getCurrentUser();
        if (user) {
          set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } else {
          set({ isLoading: false });
        }
    } catch (e) {
        console.error("Error during initAuth:", e);
        set({ isLoading: false, error: "Failed to initialize session." });
    }
  },
  login: async (nombre, clave) => {
    set({ isLoading: true, error: null });
    try {
        const users = await simApiAuth.fetchUsers();
        const foundUser = users.find(u => u.nombre === nombre && u.clave === clave); // ¡Simulación insegura!

        if (foundUser) {
          const userToStore: Usuario = { id: foundUser.id, nombre: foundUser.nombre, dni: foundUser.dni };
          await simApiAuth.saveCurrentUser(userToStore);
          set({ currentUser: userToStore, isAuthenticated: true, isLoading: false });
          return true;
        } else {
          set({ error: 'Nombre o contraseña incorrectos.', isLoading: false, isAuthenticated: false, currentUser: null });
          await simApiAuth.saveCurrentUser(null);
          return false;
        }
    } catch (e) {
        console.error("Error during login:", e);
        set({ error: 'Error al intentar iniciar sesión.', isLoading: false, isAuthenticated: false, currentUser: null });
        return false;
    }
  },
  register: async (nombre, dni, clave, codigoMaestro) => {
    set({ isLoading: true, error: null });
    try {
        if (codigoMaestro !== CODIGO_MAESTRO_REGISTRO) {
          set({ error: 'Código maestro incorrecto.', isLoading: false });
          return false;
        }

        const users = await simApiAuth.fetchUsers();
        if (users.some(u => u.dni === dni)) {
          set({ error: 'El DNI ya está registrado.', isLoading: false });
          return false;
        }
        if (users.some(u => u.nombre.toLowerCase() === nombre.toLowerCase())) {
          set({ error: 'El Nombre de usuario ya está en uso.', isLoading: false });
          return false;
        }


        const newUser: StoredUser = { id: uuidv4(), nombre, dni, clave };
        const updatedUsers = [...users, newUser];
        await simApiAuth.saveUsers(updatedUsers);
        set({ isLoading: false });
        // Opcional: auto-login después del registro
        // const userToStore: Usuario = { id: newUser.id, nombre: newUser.nombre, dni: newUser.dni };
        // await simApiAuth.saveCurrentUser(userToStore);
        // set({ currentUser: userToStore, isAuthenticated: true, isLoading: false });
        return true;
    } catch (e) {
        console.error("Error during registration:", e);
        set({ error: 'Error durante el registro.', isLoading: false });
        return false;
    }
  },
  logout: async () => {
    set({isLoading: true});
    try {
        await simApiAuth.saveCurrentUser(null);
        set({ currentUser: null, isAuthenticated: false, error: null, isLoading: false });
    } catch (e) {
        console.error("Error during logout:", e);
        set({ error: 'Error al cerrar sesión.', isLoading: false });
    }
  },
}));
