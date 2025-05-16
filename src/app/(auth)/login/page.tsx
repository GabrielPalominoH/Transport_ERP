// @ts-nocheck
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep Label import
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react"

const loginSchema = z.object({
  // nombre: z.string().min(1, "Nombre de usuario es requerido"), // Changed to email
  email: z.string().email("Correo electrónico inválido").min(1, "Correo electrónico es requerido"),
  clave: z.string().min(1, "Contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError, isLoading, clearError, isAuthenticated } = useAuthStore();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      clave: '',
    },
  });

  // useEffect(() => {
  //   clearError(); // Removed this to prevent premature error clearing
  // }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/compras');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.email, data.clave); // Use data.email
    if (success) {
      router.replace('/compras'); 
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email" // Changed from nombre to email
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
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ingresar
            </Button>
            <Button variant="link" asChild className="text-sm">
              <Link href="/register">¿No tienes cuenta? Regístrate</Link>
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
