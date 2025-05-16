// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Not strictly needed if using FormLabel
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle2 } from "lucide-react"

const registerSchema = z.object({
  nombre: z.string().min(3, "Nombre debe tener al menos 3 caracteres"),
  dni: z.string().length(8, "DNI debe tener 8 dígitos").regex(/^[0-9]+$/, "DNI debe ser numérico"),
  email: z.string().email("Correo electrónico inválido").min(1, "Correo electrónico es requerido"),
  clave: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  codigoMaestro: z.string().min(1, "Código maestro es requerido"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, error: authError, isLoading, clearError, isAuthenticated } = useAuthStore();
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      dni: '',
      email: '',
      clave: '',
      codigoMaestro: '',
    },
  });

 useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/compras');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    setRegistrationSuccess(null);
    clearError(); 
    const success = await registerUser(data.nombre, data.dni, data.email, data.clave, data.codigoMaestro);
    if (success) {
      setRegistrationSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
      form.reset(); 
      setTimeout(() => router.push('/login'), 3000); // Redirect to login after success
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Complete el formulario para registrar un nuevo usuario</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {registrationSuccess && (
              <Alert variant="default" className="bg-green-100 border-green-300 text-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{registrationSuccess}</AlertDescription>
              </Alert>
            )}
            {authError && !registrationSuccess &&(
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Registro</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="Documento de Identidad (8 dígitos)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clave"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigoMaestro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Maestro</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Código de acceso especial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar
            </Button>
            <Button variant="link" asChild className="text-sm">
              <Link href="/login">¿Ya tienes cuenta? Inicia Sesión</Link>
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
