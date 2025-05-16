"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useCompraStore, type CompraFilters } from '@/stores/compraStore';
import { useProveedorStore } from '@/stores/proveedorStore';
import { useTransportistaStore } from '@/stores/transportistaStore';
import type { Compra } from '@/interfaces/compra';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Truck, Loader2 } from 'lucide-react';
import { PaginationControls } from '@/components/common/PaginationControls';
import { PurchaseFiltersComponent } from './PurchaseFilters';
import { AssignTransportModal } from './AssignTransportModal';
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export default function ListComprasClientPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { compras, fetchCompras, isLoading: comprasLoading, deleteCompra, filters, setFilters } = useCompraStore();
  const { proveedores, fetchProveedores, getProveedorById, isLoading: proveedoresLoading } = useProveedorStore();
  const { transportistas, fetchTransportistas, getTransportistaById, isLoading: transportistasLoading } = useTransportistaStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompraForAssignment, setSelectedCompraForAssignment] = useState<Compra | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchTransportistas();
  }, [fetchCompras, fetchProveedores, fetchTransportistas]);

  const isLoading = comprasLoading || proveedoresLoading || transportistasLoading;

  const filteredCompras = useMemo(() => {
    return compras.filter(compra => {
      const proveedor = getProveedorById(compra.proveedorId);
      const transportista = compra.transportistaAsignadoId ? getTransportistaById(compra.transportistaAsignadoId) : null;
      const searchTermLower = filters.searchTerm?.toLowerCase() || "";

      const matchSearch = !filters.searchTerm ||
        proveedor?.nombre.toLowerCase().includes(searchTermLower) ||
        proveedor?.ruc.includes(searchTermLower) ||
        transportista?.nombre.toLowerCase().includes(searchTermLower) ||
        transportista?.ruc.includes(searchTermLower) ||
        compra.materiaPrima.toLowerCase().includes(searchTermLower) ||
        compra.codigo.toLowerCase().includes(searchTermLower);

      const matchMateriaPrima = !filters.materiaPrima || compra.materiaPrima.toLowerCase().includes(filters.materiaPrima.toLowerCase());
      
      const matchEstadoServicio = !filters.estadoServicio || compra.estadoServicio === filters.estadoServicio;

      let matchFechaInicio = true;
      if (filters.fechaInicio) {
        try {
          matchFechaInicio = parseISO(compra.fechaCompra) >= parseISO(filters.fechaInicio);
        } catch (e) { /* ignore invalid date */ }
      }

      let matchFechaFin = true;
      if (filters.fechaFin) {
         try {
          matchFechaFin = parseISO(compra.fechaCompra) <= parseISO(filters.fechaFin);
        } catch (e) { /* ignore invalid date */ }
      }
      
      return matchSearch && matchMateriaPrima && matchEstadoServicio && matchFechaInicio && matchFechaFin;
    }).sort((a,b) => b.codigo.localeCompare(a.codigo)); // Sort by newest code first
  }, [compras, filters, getProveedorById, getTransportistaById]);

  const paginatedCompras = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompras.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCompras, currentPage]);

  const totalPages = Math.ceil(filteredCompras.length / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta compra?')) {
      try {
        await deleteCompra(id);
        toast({ title: "Compra Eliminada", description: "La compra ha sido eliminada exitosamente." });
        if (paginatedCompras.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la compra." });
      }
    }
  };

  const handleOpenAssignModal = (compra: Compra) => {
    setSelectedCompraForAssignment(compra);
    setAssignModalOpen(true);
  };
  
  const handleFilterChange = (newFilters: CompraFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset page on filter change
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Compras</h1>
        <Button asChild size="lg">
          <Link href="/compras/nuevo">
            <PlusCircle className="mr-2 h-5 w-5" /> Nueva Compra
          </Link>
        </Button>
      </div>

      <PurchaseFiltersComponent currentFilters={filters} onFilterChange={handleFilterChange} />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && compras.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Cargando compras...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Materia Prima</TableHead>
                      <TableHead>Fecha Compra</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Transportista</TableHead>
                      <TableHead>Fechas Transporte</TableHead>
                      <TableHead className="text-right w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCompras.length > 0 ? (
                      paginatedCompras.map((compra) => {
                        const proveedor = getProveedorById(compra.proveedorId);
                        const transportista = compra.transportistaAsignadoId ? getTransportistaById(compra.transportistaAsignadoId) : null;
                        return (
                          <TableRow key={compra.id}>
                            <TableCell className="font-mono">{compra.codigo}</TableCell>
                            <TableCell>{proveedor ? `${proveedor.nombre} (${proveedor.ruc})` : 'N/A'}</TableCell>
                            <TableCell>{compra.materiaPrima}</TableCell>
                            <TableCell>{format(parseISO(compra.fechaCompra), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-right">${compra.costoTransporteTotal.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">${compra.saldoTotal.toFixed(2)}</TableCell>
                            <TableCell><Badge variant={compra.estadoServicio === 'pagado' ? 'default' : 'secondary'}>{compra.estadoServicio}</Badge></TableCell>
                            <TableCell>{transportista ? transportista.nombre : <span className="text-muted-foreground italic">No asignado</span>}</TableCell>
                            <TableCell>
                              {compra.fechaInicioTransporte && compra.fechaFinTransporte
                                ? `${format(parseISO(compra.fechaInicioTransporte), 'dd/MM/yy')} - ${format(parseISO(compra.fechaFinTransporte), 'dd/MM/yy')}`
                                : <span className="text-muted-foreground italic">N/A</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/compras/editar/${compra.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar Compra
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenAssignModal(compra)}>
                                    <Truck className="mr-2 h-4 w-4" /> 
                                    {compra.transportistaAsignadoId ? 'Modificar Transporte' : 'Asignar Transporte'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(compra.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Compra
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center h-24">
                          {filters.searchTerm || filters.materiaPrima || filters.estadoServicio || filters.fechaInicio || filters.fechaFin ? "No se encontraron compras con esos filtros." : "No hay compras registradas."}
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
                totalItems={filteredCompras.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AssignTransportModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        compra={selectedCompraForAssignment}
      />
    </div>
  );
}
