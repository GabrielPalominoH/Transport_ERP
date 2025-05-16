"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransportistaStore } from '@/stores/transportistaStore';
import { TransportistaForm } from '../components/TransportistaForm';
import type { Transportista } from '@/interfaces/transportista';
import { useToast } from "@/hooks/use-toast";

export default function ManageTransportistaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addTransportista = useTransportistaStore((state) => state.addTransportista);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<Transportista, 'id'>) => {
    setIsSubmitting(true);
    try {
      await addTransportista(data);
      toast({ title: "Transportista Creado", description: "El nuevo transportista ha sido añadido exitosamente." });
      router.push('/transportistas');
    } catch (error) {
      console.error("Error creating transportista:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el transportista." });
      setIsSubmitting(false);
    }
  };

  return (
    <TransportistaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
  );
}
