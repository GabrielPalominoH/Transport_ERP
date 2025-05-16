"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransportistaStore } from '@/stores/transportistaStore';
import type { Transportista } from '@/interfaces/transportista';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export default function TransportistasClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { transportistas, fetchTransportistas, isLoading, deleteTransportista } = useTransportistaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransportistas();
  }, [fetchTransportistas]);

  const filteredTransportistas = useMemo(() => {
    return transportistas.filter(t =>
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ruc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transportistas, searchTerm]);

  const paginatedTransportistas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransportistas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransportistas, currentPage]);

  const totalPages = Math.ceil(filteredTransportistas.length / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este transportista?')) {
      try {
        await deleteTransportista(id);
        toast({ title: "Transportista Eliminado", description: "El transportista ha sido eliminado exitosamente." });
        // Reset to page 1 if current page becomes empty
        if (paginatedTransportistas.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el transportista." });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle>Gestión de Transportistas</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o RUC..."
                className="pl-8 sm:w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page on search
                }}
              />
            </div>
            <Button asChild>
              <Link href="/transportistas/nuevo">
                <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Transportista
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && transportistas.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Cargando transportistas...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Tipo Cuenta</TableHead>
                    <TableHead>Nro. Cuenta</TableHead>
                    <TableHead>CCI</TableHead>
                    <TableHead className="text-right w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransportistas.length > 0 ? (
                    paginatedTransportistas.map((transportista) => (
                      <TableRow key={transportista.id}>
                        <TableCell className="font-medium">{transportista.nombre}</TableCell>
                        <TableCell>{transportista.ruc}</TableCell>
                        <TableCell>{transportista.tipoCuenta}</TableCell>
                        <TableCell>{transportista.nroCuenta}</TableCell>
                        <TableCell>{transportista.cci}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/transportistas/editar/${transportista.id}`)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(transportista.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        {searchTerm ? "No se encontraron transportistas con ese criterio." : "No hay transportistas registrados."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={filteredTransportistas.length}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
