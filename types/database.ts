export type EstadoOT =
  | "pendiente"
  | "en_proceso"
  | "esperando_repuesto"
  | "listo"
  | "cerrado";

export type TipoItem = "trabajo" | "repuesto";
export type TipoFoto = "recepcion" | "proceso" | "entrega";

export interface Taller {
  id: string;
  nombre: string;
  rut: string;
  direccion: string;
  comuna: string;
  telefono: string;
  whatsapp: string;
  especialidades: string[];
  horario: string;
  rating: number;
  verified: boolean;
  created_at: string;
}

export interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  kms_actuales: number;
  aceite_recomendado: string;
  numero_motor: string;
  taller_id: string;
  cliente_nombre: string;
  cliente_whatsapp: string;
  notas_internas: string;
  created_at: string;
}

export interface OrdenTrabajo {
  id: string;
  numero_ot: number;
  taller_id: string;
  vehiculo_id: string;
  descripcion_problema: string;
  estado: EstadoOT;
  monto_total: number;
  monto_neto: number;
  monto_iva: number;
  link_token: string;
  aprobado_por_cliente: boolean;
  aprobado_at: string | null;
  created_at: string;
  updated_at: string;
  vehiculo?: Vehiculo;
  items?: ItemOT[];
  fotos?: FotoOT[];
}

export interface ItemOT {
  id: string;
  ot_id: string;
  tipo: TipoItem;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface FotoOT {
  id: string;
  ot_id: string;
  tipo: TipoFoto;
  url: string;
  descripcion: string;
  created_at: string;
}

export interface Inventario {
  id: string;
  taller_id: string;
  nombre: string;
  codigo_ref: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
  proveedor: string;
  created_at: string;
}

export interface PresupuestoPublico {
  taller: Pick<Taller, "nombre" | "direccion" | "comuna" | "telefono" | "whatsapp">;
  vehiculo: Pick<Vehiculo, "patente" | "marca" | "modelo" | "anio" | "color" | "kms_actuales" | "cliente_nombre">;
  ot: Pick<OrdenTrabajo, "id" | "numero_ot" | "descripcion_problema" | "estado" | "monto_total" | "monto_neto" | "monto_iva" | "aprobado_por_cliente" | "aprobado_at" | "created_at">;
  items: ItemOT[];
  fotos_recepcion: FotoOT[];
}
