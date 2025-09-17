export interface RazonSocial {
  id: number;
  nombre: string;
  rfc: string;
}

export interface Cliente {
  id: number;
  razonSocialId: number;
  nombre: string;
  rfc?: string;
  direccion?: string;
  contactoPrincipal: {
    nombre: string;
    telefono: string;
    email: string;
  };
}

export type TipoContrato =
  | 'Precio Unitario'
  | 'Precio Alzado'
  | 'Precio máximo garantizado'
  | 'Precio Alzado en base a Precios Unitarios'
  | 'Precio Alzado Máximo Garantizado'
  | 'Orden de trabajo'
  | 'Orden de Compra';

export interface Contrato {
  id: number;
  razonSocialId: number;
  clienteId: number;
  nombreProyecto: string;
  folio: string;
  objeto: string;
  monto: number;
  moneda: 'MXN' | 'USD';
  tipoDeCambio?: number;
  fechaInicio: string;
  fechaTermino: string;
  tipoContrato: TipoContrato;
  tipoIVA: 'IVA 16%' | 'Tasa 0%' | 'No Aplica';
  anticipoPorcentaje: number;
  fondoGarantiaPorcentaje: number;
  montoAnticipoOtorgado: number;
  estatus: 'Vigente' | 'Vencido' | 'Cancelado';
  fianzaAnticipo?: string; // Folio o descripción de la fianza
  penalizaciones?: string; // Descripción de penalizaciones
}

export interface OrdenDeCambio {
  id: number;
  contratoId: number;
  descripcion: string;
  montoAdicionalDeduccion: number;
  nuevaFechaTermino?: string;
  fechaAprobacion: string;
  autorizadoPor: string;
}

export interface Factura {
  id: number;
  contratoId: number;
  folioFactura: string;
  fechaEmision: string;
  concepto: string;
  importeEstimacion: number;
  amortizacionAnticipo: number;
  fondoGarantia: number;
  deductivaCargos: number;
  estatus: 'Pendiente' | 'Pagada';
  fechaPago?: string;
  comentarios?: string;
}

export interface Pago {
  id: number;
  facturaId: number;
  fechaPago: string;
  montoPagado: number;
  metodoPago: string;
  comentarios?: string;
}

export interface ProcesoConstructivo {
  id: number;
  catalogoConceptoId: number;
  nombre: string;
  porcentaje: number;
}

export interface CatalogoConcepto {
  id: number;
  nombre: string;
  disciplina: string;
}

export interface Database {
  razonesSociales: RazonSocial[];
  clientes: Cliente[];
  contratos: Contrato[];
  ordenesDeCambio: OrdenDeCambio[];
  facturas: Factura[];
  pagos: Pago[];
  catalogoConceptos: CatalogoConcepto[];
  procesosConstructivos: ProcesoConstructivo[];
}