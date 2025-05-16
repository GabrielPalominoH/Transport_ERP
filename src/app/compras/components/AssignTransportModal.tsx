"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import type { Compra } from '@/interfaces/compra';
import { useTransportistaStore } from '@/stores/transportistaStore';
import { useCompraStore } from '@/stores/compraStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


interface AssignTransportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra | null;
}

const assignTransportSchema = z.object({
  transportistaId: z.string().min(1, "Transportista es requerido"),
  fechaInicioTransporte: z.string().min(1, "Fecha de inicio es requerida").refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  fechaFinTransporte: z.string().min(1, "Fecha de fin es requerida").refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
}).refine(data => {
  if (data.fechaInicioTransporte && data.fechaFinTransporte) {
    return new Date(data.fechaFinTransporte) >= new Date(data.fechaInicioTransporte);
  }
  return true;
}, {
  message: "Fecha fin debe ser igual o posterior a fecha inicio",
  path: ["fechaFinTransporte"],
});


type AssignFormValues = z.infer<typeof assignTransportSchema>;

export function AssignTransportModal({ open, onOpenChange, compra }: AssignTransportModalProps) {
  const { transportistas, fetchTransportistas } = useTransportistaStore();
  const { assignTransporteToCompra, updateCompra } = useCompraStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignTransportSchema),
    defaultValues: {
      transportistaId: '',
      fechaInicioTransporte: '',
      fechaFinTransporte: '',
    }
  });

  useEffect(() => {
    if (open) {
        if (transportistas.length === 0) {
            fetchTransportistas();
        }
        if (compra) {
            form.reset({
                transportistaId: compra.transportistaAsignadoId || '',
                fechaInicioTransporte: compra.fechaInicioTransporte ? format(parseISO(compra.fechaInicioTransporte), 'yyyy-MM-dd') : '',
                fechaFinTransporte: compra.fechaFinTransporte ? format(parseISO(compra.fechaFinTransporte), 'yyyy-MM-dd') : '',
            });
        } else {
            form.reset({
                transportistaId: '',
                fechaInicioTransporte: '',
                fechaFinTransporte: '',
            });
        }
    }
  }, [compra, open, fetchTransportistas, form, transportistas.length]);

  if (!compra) return null;

  const onSubmit = async (data: AssignFormValues) => {
    setIsSubmitting(true);
    try {
      await assignTransporteToCompra(compra.id, data.transportistaId, data.fechaInicioTransporte, data.fechaFinTransporte);
      toast({ title: "Transporte Asignado", description: `Transporte asignado a la compra ${compra.codigo}.` });
      onOpenChange(false);
    } catch (error) {
        console.error("Error assigning transport:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo asignar el transporte." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDesasignar = async () => {
    if (window.confirm('¿Seguro que desea desasignar el transporte?')) {
      setIsSubmitting(true);
      try {
        await updateCompra(compra.id, {
          transportistaAsignadoId: null,
          fechaInicioTransporte: null,
          fechaFinTransporte: null,
        });
        toast({ title: "Transporte Desasignado", description: `Transporte desasignado de la compra ${compra.codigo}.` });
        onOpenChange(false);
      } catch (error) {
        console.error("Error de-assigning transport:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo desasignar el transporte." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {compra.transportistaAsignadoId ? 'Modificar Asignación de Transporte' : 'Asignar Transporte'} para Compra {compra.codigo}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="transportistaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transportista</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un transportista" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transportistas.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre} ({t.ruc})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="fechaInicioTransporte"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha Inicio Servicio</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="fechaFinTransporte"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha Fin Servicio</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              {compra.transportistaAsignadoId && (
                <Button type="button" variant="outline" onClick={handleDesasignar} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Desasignar
                </Button>
              )}
              <DialogClose asChild>
                 <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Guardar Asignación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
