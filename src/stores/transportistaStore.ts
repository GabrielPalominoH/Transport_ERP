// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Transportista } from '@/interfaces/transportista';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase'; // Import db from firebase
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const TRANSPORTISTAS_COLLECTION = 'transportistas_erp_lite'; // Firestore collection name

interface TransportistaState {
  transportistas: Transportista[];
  isLoading: boolean;
  error: string | null;
  fetchTransportistas: () => Promise<void>;
  addTransportista: (data: Omit<Transportista, 'id'>) => Promise<string | null>;
  updateTransportista: (id: string, data: Partial<Omit<Transportista, 'id'>>) => Promise<void>;
  deleteTransportista: (id: string) => Promise<void>;
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
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return null;
    }
    try {
      // Check if RUC already exists
      const q = query(collection(db, TRANSPORTISTAS_COLLECTION), where("ruc", "==", data.ruc));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const errorMessage = "Ya existe un transportista con este RUC.";
        console.error(errorMessage);
        set({ error: errorMessage, isLoading: false });
        // Consider throwing an error or returning a specific value to indicate duplication
        throw new Error(errorMessage); 
      }

      const docRef = await addDoc(collection(db, TRANSPORTISTAS_COLLECTION), data);
      // After adding, refetch or add to local state
      // For simplicity, we'll add to local state directly here, assuming success
      const newTransportista = { ...data, id: docRef.id };
      set(state => ({
        transportistas: [...state.transportistas, newTransportista],
        isLoading: false
      }));
      return docRef.id;
    } catch (err) {
      console.error("Error adding transportista to Firestore:", err);
      set({ error: 'Error al añadir transportista a Firestore', isLoading: false });
      return null;
    }
  },
  updateTransportista: async (id, data) => {
     set({ isLoading: true, error: null });
    if (!db) {
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return;
    }
    try {
      const transportistaRef = doc(db, TRANSPORTISTAS_COLLECTION, id);
      await updateDoc(transportistaRef, data);
      // Update local state
      set(state => ({
        transportistas: state.transportistas.map(t =>
          t.id === id ? { ...t, ...data } : t
        ),
        isLoading: false
      }));
    } catch (err) {
      console.error("Error updating transportista in Firestore:", err);
      set({ error: 'Error al actualizar transportista en Firestore', isLoading: false });
    }
  },
  deleteTransportista: async (id) => {
    set({ isLoading: true, error: null });
    if (!db) {
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return;
    }
    try {
      await deleteDoc(doc(db, TRANSPORTISTAS_COLLECTION, id));
      // Update local state
      set(state => ({
        transportistas: state.transportistas.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (err) {
      console.error("Error deleting transportista from Firestore:", err);
      set({ error: 'Error al eliminar transportista de Firestore', isLoading: false });
    }
  },
  getTransportistaById: (id: string) => {
    return get().transportistas.find(t => t.id === id);
  }
}));
