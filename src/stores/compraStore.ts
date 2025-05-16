
// @ts-nocheck
"use client";

import { create } from 'zustand';
import type { Compra, CompraFormValues, EstadoServicio } from '@/interfaces/compra';
import { format } from 'date-fns';
import { db } from '@/lib/firebase'; // Import db from firebase
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

const COMPRAS_COLLECTION = 'compras_erp_lite'; // Firestore collection name

export interface CompraFilters {
  searchTerm?: string;
  fechaInicio?: string; // ISO date
  fechaFin?: string; // ISO date
  materiaPrima?: string;
  estadoServicio?: EstadoServicio;
}

interface CompraState {
  compras: Compra[];
  filters: CompraFilters;
  isLoading: boolean;
  error: string | null;
  fetchCompras: () => Promise<void>;
  generateNextCodigo: () => Promise<string>;
  addCompra: (data: CompraFormValues) => Promise<string>; // Changed: returns string, throws on error
  updateCompra: (id: string, data: Partial<CompraFormValues & { transportistaAsignadoId?: string | null, fechaInicioTransporte?: string | null, fechaFinTransporte?: string | null, estadoServicio?: EstadoServicio }>) => Promise<void>; // Throws on error
  deleteCompra: (id: string) => Promise<void>;
  getCompraById: (id: string) => Compra | undefined;
  assignTransporteToCompra: (compraId: string, transportistaId: string, fechaInicio: string, fechaFin: string) => Promise<void>;
  setFilters: (newFilters: CompraFilters) => void;
}

export const useCompraStore = create<CompraState>((set, get) => ({
  compras: [],
  filters: {},
  isLoading: false,
  error: null,
  fetchCompras: async () => {
    set({ isLoading: true, error: null });
    if (!db) {
      set({ error: 'Firestore no está inicializado.', isLoading: false });
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, COMPRAS_COLLECTION));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Compra));
      set({ compras: data, isLoading: false });
    } catch (err) {
      console.error("Error fetching compras from Firestore:", err);
      set({ error: 'Error al cargar compras desde Firestore', isLoading: false });
    }
  },
  generateNextCodigo: async () => {
    if (!db) {
      console.error('Firestore no está inicializado para generar código.');
      const fallbackTime = new Date();
      return `ALM-${format(fallbackTime, 'yy')}-${String(fallbackTime.getTime()).slice(-4)}`;
    }
    const currentYearSuffix = format(new Date(), 'yy');
    const prefix = `ALM-${currentYearSuffix}-`;

    const q = query(
      collection(db, COMPRAS_COLLECTION),
      orderBy('codigo', 'desc'),
      limit(1)
    );
    
    let maxNum = 0;
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const latestCompra = querySnapshot.docs[0].data() as Compra;
            if (latestCompra.codigo.startsWith(prefix)) {
                 const numPart = parseInt(latestCompra.codigo.substring(prefix.length), 10);
                 if (!isNaN(numPart)) {
                    maxNum = numPart;
                 }
            }
        }
    } catch (error) {
        console.error("Error fetching latest compra code from Firestore:", error);
    }
    
    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${nextNum}`;
  },
  addCompra: async (data) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    const { costoTransporteTotal, adelanto = 0, ...restData } = data;
    
    try {
      const codigo = await get().generateNextCodigo();
      const nuevaCompraData: Omit<Compra, 'id'> = {
        ...restData,
        codigo,
        costoTransporteTotal,
        adelanto,
        saldoTotal: costoTransporteTotal - adelanto,
      };
      const docRef = await addDoc(collection(db, COMPRAS_COLLECTION), nuevaCompraData);
      const nuevaCompra = { ...nuevaCompraData, id: docRef.id };
      set(state => ({
        compras: [...state.compras, nuevaCompra],
        isLoading: false
      }));
      return docRef.id;
    } catch (err: any) {
      console.error("Error adding compra to Firestore:", err);
      set({ error: 'Error al añadir compra a Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error to be caught by the UI component
    }
  },
  updateCompra: async (id, dataToUpdate) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      const compraRef = doc(db, COMPRAS_COLLECTION, id);
      const currentCompra = get().compras.find(c => c.id === id);
      if (!currentCompra) {
          throw new Error("Compra no encontrada para actualizar.");
      }

      const updatedData = { ...dataToUpdate };

      if (dataToUpdate.costoTransporteTotal !== undefined || dataToUpdate.adelanto !== undefined) {
        const finalCosto = dataToUpdate.costoTransporteTotal ?? currentCompra.costoTransporteTotal;
        const finalAdelanto = dataToUpdate.adelanto ?? currentCompra.adelanto ?? 0;
        updatedData.saldoTotal = finalCosto - finalAdelanto;
      }
      
      await updateDoc(compraRef, updatedData);
      set(state => ({
        compras: state.compras.map(c =>
          c.id === id ? { ...c, ...updatedData } : c
        ),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error updating compra in Firestore:", err);
      set({ error: 'Error al actualizar compra en Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  deleteCompra: async (id) => {
    set({ isLoading: true, error: null });
    if (!db) {
      const errorMsg = 'Firestore no está inicializado.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
    try {
      await deleteDoc(doc(db, COMPRAS_COLLECTION, id));
      set(state => ({
        compras: state.compras.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Error deleting compra from Firestore:", err);
      set({ error: 'Error al eliminar compra de Firestore: ' + err.message, isLoading: false });
      throw err; // Re-throw the error
    }
  },
  getCompraById: (id: string) => {
    return get().compras.find(c => c.id === id);
  },
  assignTransporteToCompra: async (compraId, transportistaId, fechaInicio, fechaFin) => {
    // This method already calls updateCompra which will now throw on error.
    const updateData = {
      transportistaAsignadoId: transportistaId,
      fechaInicioTransporte: fechaInicio,
      fechaFinTransporte: fechaFin,
    };
    await get().updateCompra(compraId, updateData);
  },
  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  }
}));

