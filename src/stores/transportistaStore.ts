
// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Transportista } from '@/interfaces/transportista';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const TRANSPORTISTAS_COLLECTION = 'transportistas_erp_lite';

interface TransportistaState {
  transportistas: Transportista[];
  isLoading: boolean;
  error: string | null;
  fetchTransportistas: () => Promise<void>;
  addTransportista: (data: Omit<Transportista, 'id'>) => Promise<string>; // Changed: returns string, throws on error
  updateTransportista: (id: string, data: Partial<Omit<Transportista, 'id'>>) => Promise<void>; // Throws on error
  deleteTransportista: (id: string) => Promise<void>; // Throws on error
  getTransportistaById: (id: string) => Transportista | undefined;
}

export const useTransportistaStore = create<TransportistaState>((set, get) => ({
  transportistas: [],
  isLoading: false,
  error: null,
  fetchTransportistas: async () => {
    set({ isLoading: true, error: null });
    if (!db) {
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, TRANSPORTISTAS_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transportista));
      set({ transportistas: data, isLoading: false });
    } catch (err) {
      console.error("Error fetching transportistas from Firestore:", err);
      set({ error: 'Error al cargar transportistas desde Firestore', isLoading: false });
    }
  },
  addTransportista: async (data) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      const q = query(collection(db, TRANSPORTISTAS_COLLECTION), where("ruc", "==", data.ruc));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const errorMessage = "Ya existe un transportista con este RUC.";
        set({ error: errorMessage, isLoading: false });
        throw new Error(errorMessage); 
      }

      const docRef = await addDoc(collection(db, TRANSPORTISTAS_COLLECTION), data);
      const newTransportista = { ...data, id: docRef.id };
      set(state => ({
        transportistas: [...state.transportistas, newTransportista],
        isLoading: false
      }));
      return docRef.id;
    } catch (err: any) {
      console.error("Error adding transportista to Firestore:", err);
       if (!(err instanceof Error && err.message === "Ya existe un transportista con este RUC.")) {
         set({ error: 'Error al añadir transportista a Firestore: ' + err.message, isLoading: false });
      }
      throw err; // Re-throw the error
    }
  },
  updateTransportista: async (id, data) => {
     set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      const transportistaRef = doc(db, TRANSPORTISTAS_COLLECTION, id);
      await updateDoc(transportistaRef, data);
      set(state => ({
        transportistas: state.transportistas.map(t =>
          t.id === id ? { ...t, ...data } : t
        ),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error updating transportista in Firestore:", err);
      set({ error: 'Error al actualizar transportista en Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  deleteTransportista: async (id) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      await deleteDoc(doc(db, TRANSPORTISTAS_COLLECTION, id));
      set(state => ({
        transportistas: state.transportistas.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error deleting transportista from Firestore:", err);
      set({ error: 'Error al eliminar transportista de Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  getTransportistaById: (id: string) => {
    return get().transportistas.find(t => t.id === id);
  }
}));

