"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProveedorStore } from '@/stores/proveedorStore';
import { ProveedorForm } from '../components/ProveedorForm';
import type { Proveedor } from '@/interfaces/proveedor';
import { useToast } from "@/hooks/use-toast";

export default function ManageProveedorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addProveedor = useProveedorStore((state) => state.addProveedor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<Proveedor, 'id'>) => {
    setIsSubmitting(true);
    try {
      await addProveedor(data);
      toast({ title: "Proveedor Creado", description: "El nuevo proveedor ha sido añadido exitosamente." });
      router.push('/proveedores');
    } catch (error) {
      console.error("Error creating proveedor:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el proveedor." });
      setIsSubmitting(false);
    }
  };

  return (
    <ProveedorForm onSubmit={handleSubmit} isSubmitting={isSubmitting}/>
  );
}
