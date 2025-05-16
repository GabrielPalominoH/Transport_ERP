export interface Transportista {
  id: string; // UUID
  nombre: string;
  ruc: string;
  tipoCuenta: string; // Ej: 'Ahorros', 'Corriente'
  nroCuenta: string;
  cci: string;
}
