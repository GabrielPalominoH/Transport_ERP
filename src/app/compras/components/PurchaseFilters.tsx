"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { CompraFilters } from '@/stores/compraStore';
import { ESTADOS_SERVICIO, type EstadoServicio } from '@/interfaces/compra';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface PurchaseFiltersProps {
  currentFilters: CompraFilters;
  onFilterChange: (filters: CompraFilters) => void;
}

export function PurchaseFiltersComponent({ currentFilters, onFilterChange }: PurchaseFiltersProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onFilterChange({ ...currentFilters, [name]: value });
  };

  const handleSelectChange = (name: keyof CompraFilters) => (value: string) => {
     onFilterChange({ ...currentFilters, [name]: value === "ALL_STATUS" ? undefined : value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="searchTerm">Búsqueda General</Label>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    id="searchTerm"
                    name="searchTerm"
                    placeholder="Proveedor, Transp., Código..."
                    value={currentFilters.searchTerm || ''}
                    onChange={handleInputChange}
                    className="pl-8"
                />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="materiaPrima">Materia Prima</Label>
            <Input
              id="materiaPrima"
              name="materiaPrima"
              placeholder="Filtrar por materia prima"
              value={currentFilters.materiaPrima || ''}
              onChange={handleInputChange}
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor="estadoServicio">Estado de Servicio</Label>
            <Select
              name="estadoServicio"
              value={currentFilters.estadoServicio || "ALL_STATUS"}
              onValueChange={handleSelectChange('estadoServicio')}
            >
              <SelectTrigger id="estadoServicio">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STATUS">Todos los Estados</SelectItem>
                {ESTADOS_SERVICIO.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <Label htmlFor="fechaInicio">Fecha Desde</Label>
                <Input
                id="fechaInicio"
                name="fechaInicio"
                type="date"
                value={currentFilters.fechaInicio || ''}
                onChange={handleInputChange}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="fechaFin">Fecha Hasta</Label>
                <Input
                id="fechaFin"
                name="fechaFin"
                type="date"
                value={currentFilters.fechaFin || ''}
                onChange={handleInputChange}
                />
            </div>
          </div>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="w-full xl:w-auto"
          >
            <X className="mr-2 h-4 w-4" /> Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
