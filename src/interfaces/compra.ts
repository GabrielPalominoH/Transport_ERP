export interface Compra {
  id: string; // UUID
  codigo: string; // ALM-YY-XXXX (Ej: ALM-25-0001)
  proveedorId: string;
  // Para visualización fácil, podríamos querer tener el nombre del proveedor directamente
  // nombreProveedor?: string; 
  // rucProveedor?: string;

  materiaPrima: string;
  fechaCompra: string; // ISO Date string (ej: "2025-05-16")

  costoTransporteTotal: number;
  adelanto: number;
  saldoTotal: number; // Calculado: costoTransporteTotal - adelanto

  codigoFactura?: string;
  fechaEmisionFactura?: string; // ISO Date string
  codigoOSR?: string; // Orden de Servicio

  observaciones?: string;
  estadoServicio: EstadoServicio; // 'esperando orden', 'esperando aprobacion', etc.

  // Campos para la asignación de transporte
  transportistaAsignadoId?: string | null;
  // nombreTransportistaAsignado?: string; // Para visualización
  // rucTransportistaAsignado?: string; // Para visualización
  fechaInicioTransporte?: string | null; // ISO Date string
  fechaFinTransporte?: string | null; // ISO Date string
}

export type EstadoServicio =
  | "esperando orden"
  | "esperando aprobacion"
  | "esperando cuadro"
  | "esperando ok"
  | "esperando envio"
  | "pagado";

export const ESTADOS_SERVICIO: EstadoServicio[] = [
  "esperando orden",
  "esperando aprobacion",
  "esperando cuadro",
  "esperando ok",
  "esperando envio",
  "pagado",
];

// Para formularios, podríamos necesitar una interfaz diferente
// Omit 'id', 'codigo', 'saldoTotal' as they are generated or derived.
// 'proveedorId' and 'transportistaAsignadoId' types might differ in form (e.g. just string ID) vs display (object).
// The provided CompraFormInput seems to omit fields that are actually needed in the form.
// Let's refine CompraFormInput based on the fields in PurchaseForm.
export interface CompraFormValues {
  proveedorId: string;
  materiaPrima: string;
  fechaCompra: string; // ISO Date string
  costoTransporteTotal: number;
  adelanto?: number; // Optional in form, defaults to 0
  codigoFactura?: string;
  fechaEmisionFactura?: string; // ISO Date string
  codigoOSR?: string;
  observaciones?: string;
  estadoServicio: EstadoServicio;
}
