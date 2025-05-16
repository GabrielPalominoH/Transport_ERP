"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Transportista, TipoCuentaBancaria } from '@/interfaces/transportista'; // Updated import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Not explicitly used if using FormLabel
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const transportistaSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  ruc: z.string().length(11, "RUC debe tener 11 dígitos").regex(/^[0-9]+$/, "RUC debe ser numérico"),
  tipoCuenta: z.custom<TipoCuentaBancaria>((val) => ["BCP", "OTROS"].includes(val as TipoCuentaBancaria), {
    message: "Tipo de cuenta es requerido",
  }),
  nroCuenta: z.string().min(1, "Número de cuenta es requerido"),
  cci: z.string().length(20, "CCI debe tener 20 dígitos").regex(/^[0-9]+$/, "CCI debe ser numérico").optional().or(z.literal('')), // Optional and allows empty string
});

type TransportistaFormValues = z.infer<typeof transportistaSchema>;

const tiposCuentaOptions: TipoCuentaBancaria[] = ["BCP", "OTROS"];

interface TransportistaFormProps {
  onSubmit: (data: TransportistaFormValues) => Promise<void>;
  initialData?: Transportista;
  isSubmitting?: boolean;
}

export function TransportistaForm({ onSubmit, initialData, isSubmitting }: TransportistaFormProps) {
  const form = useForm<TransportistaFormValues>({
    resolver: zodResolver(transportistaSchema),
    defaultValues: initialData ? {
      ...initialData,
      cci: initialData.cci || '', // Ensure cci is empty string if undefined/null
    } : {
      nombre: '',
      ruc: '',
      tipoCuenta: 'BCP', // Default value
      nroCuenta: '',
      cci: '',
    },
  });

  const handleSubmitForm: SubmitHandler<TransportistaFormValues> = async (data) => {
    // Ensure optional cci is passed as undefined if empty, or keep as is if provided
    const dataToSubmit = {
        ...data,
        cci: data.cci === '' ? undefined : data.cci,
    };
    await onSubmit(dataToSubmit);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{initialData ? 'Editar Transportista' : 'Nuevo Transportista'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del transportista" {...field} />
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
             <FormField
              control={form.control}
              name="tipoCuenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cuenta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposCuentaOptions.map(tipo => (
                         <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nroCuenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Cuenta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 0011-0123-0123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cci"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CCI (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 00200110123012345678900 (20 dígitos)" {...field} />
                  </FormControl>
                   <FormDescription>
                    Código de Cuenta Interbancario. Si se ingresa, debe tener 20 dígitos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initialData ? 'Actualizar Transportista' : 'Crear Transportista'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
