
// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Proveedor } from '@/interfaces/proveedor';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const PROVEEDORES_COLLECTION = 'proveedores_erp_lite';

interface ProveedorState {
  proveedores: Proveedor[];
  isLoading: boolean;
  error: string | null;
  fetchProveedores: () => Promise<void>;
  addProveedor: (data: Omit<Proveedor, 'id'>) => Promise<string>; // Changed: returns string, throws on error
  updateProveedor: (id: string, data: Partial<Omit<Proveedor, 'id'>>) => Promise<void>; // Throws on error
  deleteProveedor: (id: string) => Promise<void>; // Throws on error
  getProveedorById: (id: string) => Proveedor | undefined;
}

export const useProveedorStore = create<ProveedorState>((set, get) => ({
  proveedores: [],
  isLoading: false,
  error: null,
  fetchProveedores: async () => {
    set({ isLoading: true, error: null });
    if (!db) {
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, PROVEEDORES_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proveedor));
      set({ proveedores: data, isLoading: false });
    } catch (err) {
      console.error("Error fetching proveedores from Firestore:", err);
      set({ error: 'Error al cargar proveedores desde Firestore', isLoading: false });
    }
  },
  addProveedor: async (data) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      const q = query(collection(db, PROVEEDORES_COLLECTION), where("ruc", "==", data.ruc));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const errorMessage = "Ya existe un proveedor con este RUC.";
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage);
      }

      const docRef = await addDoc(collection(db, PROVEEDORES_COLLECTION), data);
      const newProveedor = { ...data, id: docRef.id };
      set(state => ({
        proveedores: [...state.proveedores, newProveedor],
        isLoading: false
      }));
      return docRef.id;
    } catch (err: any) {
      console.error("Error adding proveedor to Firestore:", err);
      // Avoid overwriting specific RUC error message
      if (!(err instanceof Error && err.message === "Ya existe un proveedor con este RUC.")) {
        set({ error: 'Error al añadir proveedor a Firestore: ' + err.message, isLoading: false });
      }
      throw err; // Re-throw the error
    }
  },
  updateProveedor: async (id, data) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      const proveedorRef = doc(db, PROVEEDORES_COLLECTION, id);
      await updateDoc(proveedorRef, data);
      set(state => ({
        proveedores: state.proveedores.map(p =>
          p.id === id ? { ...p, ...data } : p
        ),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error updating proveedor in Firestore:", err);
      set({ error: 'Error al actualizar proveedor en Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  deleteProveedor: async (id) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      await deleteDoc(doc(db, PROVEEDORES_COLLECTION, id));
      set(state => ({
        proveedores: state.proveedores.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error deleting proveedor from Firestore:", err);
      set({ error: 'Error al eliminar proveedor de Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  getProveedorById: (id: string) => {
    return get().proveedores.find(p => p.id === id);
  }
}));

