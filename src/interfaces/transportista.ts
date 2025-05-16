export type TipoCuentaBancaria = "BCP" | "OTROS";

export interface Transportista {
  id: string; // UUID
  nombre: string;
  ruc: string;
  tipoCuenta: TipoCuentaBancaria; // Actualizado
  nroCuenta: string;
  cci?: string; // CCI es opcional
}
