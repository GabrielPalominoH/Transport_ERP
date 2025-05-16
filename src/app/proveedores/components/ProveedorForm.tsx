"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Proveedor } from '@/interfaces/proveedor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const proveedorSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  ruc: z.string().min(11, "RUC debe tener 11 dígitos").max(11, "RUC debe tener 11 dígitos"),
});

type ProveedorFormValues = z.infer<typeof proveedorSchema>;

interface ProveedorFormProps {
  onSubmit: (data: ProveedorFormValues) => Promise<void>;
  initialData?: Proveedor;
  isSubmitting?: boolean;
}

export function ProveedorForm({ onSubmit, initialData, isSubmitting }: ProveedorFormProps) {
  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: initialData || {
      nombre: '',
      ruc: '',
    },
  });

  const handleSubmitForm: SubmitHandler<ProveedorFormValues> = async (data) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)}>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>{initialData ? 'Editar Proveedor' : 'Nuevo Proveedor'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Razón social o nombre del proveedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ruc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUC</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initialData ? 'Actualizar Proveedor' : 'Crear Proveedor'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
