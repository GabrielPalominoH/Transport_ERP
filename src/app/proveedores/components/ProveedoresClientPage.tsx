"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProveedorStore } from '@/stores/proveedorStore';
import type { Proveedor } from '@/interfaces/proveedor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export default function ProveedoresClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { proveedores, fetchProveedores, isLoading, deleteProveedor } = useProveedorStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const filteredProveedores = useMemo(() => {
    return proveedores.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ruc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [proveedores, searchTerm]);

  const paginatedProveedores = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProveedores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProveedores, currentPage]);

  const totalPages = Math.ceil(filteredProveedores.length / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await deleteProveedor(id);
        toast({ title: "Proveedor Eliminado", description: "El proveedor ha sido eliminado exitosamente." });
         if (paginatedProveedores.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el proveedor." });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle>Gestión de Proveedores</CardTitle>
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
              <Link href="/proveedores/nuevo">
                <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Proveedor
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
         {isLoading && proveedores.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Cargando proveedores...</p>
          </div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead className="text-right w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProveedores.length > 0 ? (
                paginatedProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.ruc}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                             <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/proveedores/editar/${proveedor.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(proveedor.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                     {searchTerm ? "No se encontraron proveedores con ese criterio." : "No hay proveedores registrados."}
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
            totalItems={filteredProveedores.length}
        />
        </>
        )}
      </CardContent>
    </Card>
  );
}
