"use client";

import { create } from 'zustand';
import type { Transportista } from '@/interfaces/transportista';
import { v4 as uuidv4 } from 'uuid';

// SIMULACIÓN DE API (reemplazar con llamadas a backend en un futuro)
const simApi = {
  fetchTransportistas: async (): Promise<Transportista[]> => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('transportistas_erp_lite');
    return data ? JSON.parse(data) : [];
  },
  saveTransportistas: async (transportistas: Transportista[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('transportistas_erp_lite', JSON.stringify(transportistas));
  },
};

interface TransportistaState {
  transportistas: Transportista[];
  isLoading: boolean;
  error: string | null;
  fetchTransportistas: () => Promise<void>;
  addTransportista: (data: Omit<Transportista, 'id'>) => Promise<void>;
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
    try {
      const data = await simApi.fetchTransportistas();
      set({ transportistas: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Error al cargar transportistas', isLoading: false });
    }
  },
  addTransportista: async (data) => {
    const nuevaData = { ...data, id: uuidv4() };
    const actuales = get().transportistas;
    const nuevos = [...actuales, nuevaData];
    await simApi.saveTransportistas(nuevos);
    set({ transportistas: nuevos });
  },
  updateTransportista: async (id, data) => {
    const actualizados = get().transportistas.map(t => 
      t.id === id ? { ...t, ...data } : t
    );
    await simApi.saveTransportistas(actualizados);
    set({ transportistas: actualizados });
  },
  deleteTransportista: async (id) => {
    const filtrados = get().transportistas.filter(t => t.id !== id);
    await simApi.saveTransportistas(filtrados);
    set({ transportistas: filtrados });
  },
  getTransportistaById: (id: string) => {
    return get().transportistas.find(t => t.id === id);
  }
}));
