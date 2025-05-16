"use client";

import { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import type { Compra, CompraFormValues, EstadoServicio } from '@/interfaces/compra';
import { ESTADOS_SERVICIO } from '@/interfaces/compra';
import { useProveedorStore } from '@/stores/proveedorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const purchaseFormSchema = z.object({
  proveedorId: z.string().min(1, "Proveedor es requerido"),
  materiaPrima: z.string().min(1, "Materia prima es requerida"),
  fechaCompra: z.string().min(1, "Fecha de compra es requerida").refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  costoTransporteTotal: z.coerce.number().min(0, "Costo debe ser positivo o cero"),
  adelanto: z.coerce.number().min(0, "Adelanto debe ser positivo o cero").optional(),
  codigoFactura: z.string().optional(),
  fechaEmisionFactura: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  codigoOSR: z.string().optional(),
  observaciones: z.string().optional(),
  estadoServicio: z.custom<EstadoServicio>((val) => ESTADOS_SERVICIO.includes(val as EstadoServicio), {
    message: "Estado de servicio inválido",
  }),
});

interface PurchaseFormProps {
  onSubmit: (data: CompraFormValues) => Promise<void>;
  initialData?: Compra;
  isSubmitting?: boolean;
}

export function PurchaseForm({ onSubmit, initialData, isSubmitting }: PurchaseFormProps) {
  const { proveedores, fetchProveedores } = useProveedorStore();

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: initialData 
      ? {
          ...initialData,
          fechaCompra: initialData.fechaCompra ? format(parseISO(initialData.fechaCompra), 'yyyy-MM-dd') : '',
          fechaEmisionFactura: initialData.fechaEmisionFactura ? format(parseISO(initialData.fechaEmisionFactura), 'yyyy-MM-dd') : '',
          adelanto: initialData.adelanto ?? 0,
        }
      : {
          proveedorId: '',
          materiaPrima: '',
          fechaCompra: format(new Date(), 'yyyy-MM-dd'),
          costoTransporteTotal: 0,
          adelanto: 0,
          estadoServicio: ESTADOS_SERVICIO[0],
          codigoFactura: '',
          fechaEmisionFactura: '',
          codigoOSR: '',
          observaciones: '',
        },
  });

  useEffect(() => {
    if (proveedores.length === 0) {
      fetchProveedores();
    }
  }, [fetchProveedores, proveedores.length]);
  
  const costoTotal = form.watch('costoTransporteTotal', initialData?.costoTransporteTotal || 0);
  const adelanto = form.watch('adelanto', initialData?.adelanto || 0);
  const saldoTotal = costoTotal - (adelanto || 0);

  const handleSubmitForm: SubmitHandler<CompraFormValues> = async (data) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)}>
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{initialData ? 'Editar Compra' : 'Nueva Compra'}</CardTitle>
            <CardDescription>
              {initialData ? `Modificando la compra ${initialData.codigo}` : 'Complete los detalles de la nueva compra.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="proveedorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un proveedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.ruc})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materiaPrima"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materia Prima</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Arena Gruesa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaCompra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Compra</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costoTransporteTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo Transporte Total</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adelanto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adelanto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Saldo Total</FormLabel>
              <Input value={saldoTotal.toFixed(2)} readOnly disabled className="bg-muted/50" />
            </FormItem>
            <FormField
              control={form.control}
              name="codigoFactura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Factura (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: F001-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaEmisionFactura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Emisión Factura (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigoOSR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código OSR (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: OSR-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estadoServicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado del Servicio</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADOS_SERVICIO.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Anotaciones adicionales sobre la compra..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initialData ? 'Actualizar Compra' : 'Crear Compra'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
