"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProveedorStore } from '@/stores/proveedorStore';
import { ProveedorForm } from '../../components/ProveedorForm';
import type { Proveedor } from '@/interfaces/proveedor';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProveedorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;

  const updateProveedor = useProveedorStore((state) => state.updateProveedor);
  const getProveedorById = useProveedorStore((state) => state.getProveedorById);
  const fetchProveedores = useProveedorStore((state) => state.fetchProveedores);
  const proveedores = useProveedorStore((state) => state.proveedores);

  const [proveedor, setProveedor] = useState<Proveedor | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProveedor = async () => {
      if (proveedores.length === 0) {
        await fetchProveedores();
      }
      const currentProveedor = useProveedorStore.getState().getProveedorById(id as string);
      if (currentProveedor) {
        setProveedor(currentProveedor);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Proveedor no encontrado." });
        router.push('/proveedores');
      }
      setIsLoading(false);
    };

    if (id) {
      loadProveedor();
    }
  }, [id, fetchProveedores, router, toast, proveedores.length]);


  const handleSubmit = async (data: Omit<Proveedor, 'id'>) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateProveedor(id as string, data);
      toast({ title: "Proveedor Actualizado", description: "Los datos del proveedor han sido actualizados." });
      router.push('/proveedores');
    } catch (error) {
      console.error("Error updating proveedor:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el proveedor." });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
     return (
      <div className="w-full max-w-lg mx-auto space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  
  if (!proveedor) {
    return <p>Proveedor no encontrado.</p>;
  }

  return (
    <ProveedorForm 
      onSubmit={handleSubmit} 
      initialData={proveedor} 
      isSubmitting={isSubmitting}
    />
  );
}
