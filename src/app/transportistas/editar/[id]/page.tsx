"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTransportistaStore } from '@/stores/transportistaStore';
import { TransportistaForm } from '../../components/TransportistaForm';
import type { Transportista } from '@/interfaces/transportista';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTransportistaPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;
  
  const updateTransportista = useTransportistaStore((state) => state.updateTransportista);
  const getTransportistaById = useTransportistaStore((state) => state.getTransportistaById);
  const fetchTransportistas = useTransportistaStore((state) => state.fetchTransportistas);
  const transportistas = useTransportistaStore((state) => state.transportistas);


  const [transportista, setTransportista] = useState<Transportista | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Ensure transportistas are loaded, then find the specific one.
    // This is important if the user navigates directly to this page.
    const loadTransportista = async () => {
      if (transportistas.length === 0) {
        await fetchTransportistas(); // fetch if not already populated
      }
      // getTransportistaById will now use the potentially updated list
      const currentTransportista = useTransportistaStore.getState().getTransportistaById(id as string);
      if (currentTransportista) {
        setTransportista(currentTransportista);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Transportista no encontrado." });
        router.push('/transportistas');
      }
      setIsLoading(false);
    };

    if (id) {
      loadTransportista();
    }
  }, [id, fetchTransportistas, router, toast, transportistas.length]);


  const handleSubmit = async (data: Omit<Transportista, 'id'>) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateTransportista(id as string, data);
      toast({ title: "Transportista Actualizado", description: "Los datos del transportista han sido actualizados." });
      router.push('/transportistas');
    } catch (error) {
      console.error("Error updating transportista:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el transportista." });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!transportista) {
    // Already handled by toast and redirect in useEffect, but as a fallback
    return <p>Transportista no encontrado.</p>; 
  }

  return (
    <TransportistaForm 
      onSubmit={handleSubmit} 
      initialData={transportista} 
      isSubmitting={isSubmitting}
    />
  );
}
