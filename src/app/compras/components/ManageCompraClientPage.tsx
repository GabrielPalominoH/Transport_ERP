"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCompraStore } from '@/stores/compraStore';
import { PurchaseForm } from './PurchaseForm';
import type { Compra, CompraFormValues } from '@/interfaces/compra';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

interface ManageCompraClientPageProps {
  compraId?: string; // For edit mode
}

export default function ManageCompraClientPage({ compraId }: ManageCompraClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const addCompra = useCompraStore((state) => state.addCompra);
  const updateCompra = useCompraStore((state) => state.updateCompra);
  const getCompraById = useCompraStore((state) => state.getCompraById);
  const fetchCompras = useCompraStore((state) => state.fetchCompras);
  const compras = useCompraStore((state) => state.compras);

  const [initialCompraData, setInitialCompraData] = useState<Compra | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!!compraId); // Only load if compraId is present
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (compraId) {
      const loadCompra = async () => {
        setIsLoading(true);
        if (compras.length === 0) {
          await fetchCompras();
        }
        const currentCompra = useCompraStore.getState().getCompraById(compraId);
        if (currentCompra) {
          setInitialCompraData(currentCompra);
        } else {
          toast({ variant: "destructive", title: "Error", description: "Compra no encontrada." });
          router.push('/compras');
        }
        setIsLoading(false);
      };
      loadCompra();
    } else {
      setIsLoading(false); // Not in edit mode, no initial data to load
    }
  }, [compraId, fetchCompras, router, toast, compras.length]);


  const handleSubmit = async (data: CompraFormValues) => {
    setIsSubmitting(true);
    try {
      if (compraId && initialCompraData) { // Edit mode
        await updateCompra(compraId, data);
        toast({ title: "Compra Actualizada", description: "Los datos de la compra han sido actualizados." });
      } else { // Create mode
        await addCompra(data);
        toast({ title: "Compra Creada", description: "La nueva compra ha sido añadida exitosamente." });
      }
      router.push('/compras');
    } catch (error) {
      console.error("Error saving compra:", error);
      const action = compraId ? "actualizar" : "crear";
      toast({ variant: "destructive", title: "Error", description: `No se pudo ${action} la compra.` });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
     return (
      <div className="w-full max-w-3xl mx-auto space-y-6 p-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <Skeleton className="h-12 w-full md:w-1/4" />
      </div>
    );
  }
  
  return (
    <PurchaseForm 
      onSubmit={handleSubmit} 
      initialData={initialCompraData}
      isSubmitting={isSubmitting}
    />
  );
}
