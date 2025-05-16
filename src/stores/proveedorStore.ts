"use client";

import { create } from 'zustand';
import type { Proveedor } from '@/interfaces/proveedor';
import { v4 as uuidv4 } from 'uuid';

// SIMULACIÓN DE API
const simApi = {
  fetchProveedores: async (): Promise<Proveedor[]> => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('proveedores_erp_lite');
    return data ? JSON.parse(data) : [];
  },
  saveProveedores: async (proveedores: Proveedor[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('proveedores_erp_lite', JSON.stringify(proveedores));
  },
};

interface ProveedorState {
  proveedores: Proveedor[];
  isLoading: boolean;
  error: string | null;
  fetchProveedores: () => Promise<void>;
  addProveedor: (data: Omit<Proveedor, 'id'>) => Promise<void>;
  updateProveedor: (id: string, data: Partial<Omit<Proveedor, 'id'>>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  getProveedorById: (id: string) => Proveedor | undefined;
}

export const useProveedorStore = create<ProveedorState>((set, get) => ({
  proveedores: [],
  isLoading: false,
  error: null,
  fetchProveedores: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await simApi.fetchProveedores();
      set({ proveedores: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Error al cargar proveedores', isLoading: false });
    }
  },
  addProveedor: async (data) => {
    const nuevaData = { ...data, id: uuidv4() };
    const actuales = get().proveedores;
    const nuevos = [...actuales, nuevaData];
    await simApi.saveProveedores(nuevos);
    set({ proveedores: nuevos });
  },
  updateProveedor: async (id, data) => {
    const actualizados = get().proveedores.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
    await simApi.saveProveedores(actualizados);
    set({ proveedores: actualizados });
  },
  deleteProveedor: async (id) => {
    const filtrados = get().proveedores.filter(p => p.id !== id);
    await simApi.saveProveedores(filtrados);
    set({ proveedores: filtrados });
  },
  getProveedorById: (id: string) => {
    return get().proveedores.find(p => p.id === id);
  }
}));
