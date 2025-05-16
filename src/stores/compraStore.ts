"use client";

import { create } from 'zustand';
import type { Compra, CompraFormValues, EstadoServicio } from '@/interfaces/compra';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// SIMULACIÓN DE API
const simApiCompras = {
  fetchCompras: async (): Promise<Compra[]> => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('compras_erp_lite');
    return data ? JSON.parse(data) : [];
  },
  saveCompras: async (compras: Compra[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('compras_erp_lite', JSON.stringify(compras));
  },
};

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
  addCompra: (data: CompraFormValues) => Promise<void>;
  updateCompra: (id: string, data: Partial<CompraFormValues & { transportistaAsignadoId?: string | null, fechaInicioTransporte?: string | null, fechaFinTransporte?: string | null, estadoServicio?: EstadoServicio }>) => Promise<void>;
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
    try {
      const data = await simApiCompras.fetchCompras();
      set({ compras: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Error al cargar compras', isLoading: false });
    }
  },
  generateNextCodigo: async () => {
    const currentYearSuffix = format(new Date(), 'yy');
    const prefix = `ALM-${currentYearSuffix}-`;
    
    const comprasDelAnio = get().compras.filter(c => c.codigo.startsWith(prefix));
    let maxNum = 0;
    comprasDelAnio.forEach(c => {
      const numPart = parseInt(c.codigo.substring(prefix.length), 10);
      if (numPart > maxNum) {
        maxNum = numPart;
      }
    });
    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${nextNum}`;
  },
  addCompra: async (data) => {
    const { costoTransporteTotal, adelanto = 0, ...restData } = data;
    const codigo = await get().generateNextCodigo();
    const nuevaCompra: Compra = {
      ...restData,
      id: uuidv4(),
      codigo,
      costoTransporteTotal,
      adelanto,
      saldoTotal: costoTransporteTotal - adelanto,
      // estadoServicio is already in restData if it's part of CompraFormValues
      // transportistaAsignadoId, fechaInicioTransporte, fechaFinTransporte are optional
    };
    const actuales = get().compras;
    const nuevos = [...actuales, nuevaCompra];
    await simApiCompras.saveCompras(nuevos);
    set({ compras: nuevos });
  },
  updateCompra: async (id, dataToUpdate) => {
    const actualizadas = get().compras.map(c => {
      if (c.id === id) {
        const compraActualizada = { ...c, ...dataToUpdate };
        
        // Recalcular saldo si costoTransporteTotal o adelanto cambian
        if (dataToUpdate.costoTransporteTotal !== undefined || dataToUpdate.adelanto !== undefined) {
          const finalCosto = compraActualizada.costoTransporteTotal;
          const finalAdelanto = compraActualizada.adelanto || 0;
          compraActualizada.saldoTotal = finalCosto - finalAdelanto;
        }
        return compraActualizada;
      }
      return c;
    });
    await simApiCompras.saveCompras(actualizadas);
    set({ compras: actualizadas });
  },
  deleteCompra: async (id) => {
    const filtrados = get().compras.filter(c => c.id !== id);
    await simApiCompras.saveCompras(filtrados);
    set({ compras: filtrados });
  },
  getCompraById: (id: string) => {
    return get().compras.find(c => c.id === id);
  },
  assignTransporteToCompra: async (compraId, transportistaId, fechaInicio, fechaFin) => {
    const currentCompra = get().getCompraById(compraId);
    if (!currentCompra) return;

    const updatedData = {
      ...currentCompra,
      transportistaAsignadoId: transportistaId,
      fechaInicioTransporte: fechaInicio,
      fechaFinTransporte: fechaFin,
    };
     // We need to pass the data in the format expected by updateCompra
    const { id, codigo, saldoTotal, proveedorId, materiaPrima, fechaCompra, costoTransporteTotal, adelanto, ...restForUpdate } = updatedData;

    await get().updateCompra(compraId, {
      ...restForUpdate, // This will contain form values + transport assignment
      transportistaAsignadoId: transportistaId,
      fechaInicioTransporte: fechaInicio,
      fechaFinTransporte: fechaFin,
    });
  },
  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  }
}));
