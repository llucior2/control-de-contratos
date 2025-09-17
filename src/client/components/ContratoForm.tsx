import { useState, useEffect, useMemo } from 'react';
import { Cliente, RazonSocial, TipoContrato } from '../../types';

const tipoContratoOptions: TipoContrato[] = [
  'Precio Unitario',
  'Precio Alzado',
  'Precio máximo garantizado',
  'Precio Alzado en base a Precios Unitarios',
  'Precio Alzado Máximo Garantizado',
  'Orden de trabajo',
  'Orden de Compra'
];

interface ContratoFormProps {
  clientes: Cliente[];
  razonesSociales: RazonSocial[];
  onContratoAdded: () => void;
}

const ContratoForm = ({ clientes, razonesSociales, onContratoAdded }: ContratoFormProps) => {
  // Form fields state
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [folio, setFolio] = useState('');
  const [objeto, setObjeto] = useState('');
  const [monto, setMonto] = useState<number | string>('');
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN');
  const [tipoDeCambio, setTipoDeCambio] = useState<number | string>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaTermino, setFechaTermino] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('Precio Unitario');
  const [tipoIVA, setTipoIVA] = useState<'IVA 16%' | 'Tasa 0%' | 'No Aplica'>('IVA 16%');
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState<number | string>(0);
  const [fondoGarantiaPorcentaje, setFondoGarantiaPorcentaje] = useState<number | string>(5);
  const [estatus, setEstatus] = useState<'Vigente' | 'Vencido' | 'Cancelado'>('Vigente');
  const [fianzaAnticipo, setFianzaAnticipo] = useState('');
  const [penalizaciones, setPenalizaciones] = useState('');

  // New state for client and RS selection logic
  const [selectedClienteName, setSelectedClienteName] = useState<string>('');
  const [associatedRazonesSociales, setAssociatedRazonesSociales] = useState<RazonSocial[]>([]);
  const [selectedRazonSocialId, setSelectedRazonSocialId] = useState<string>('');

  const uniqueClientNames = useMemo(() => {
    const names = new Set(clientes.map(c => c.nombre));
    return Array.from(names);
  }, [clientes]);

  useEffect(() => {
    if (selectedClienteName) {
      const clientsWithName = clientes.filter(c => c.nombre === selectedClienteName);
      const rsIds = new Set(clientsWithName.map(c => c.razonSocialId));
      const associatedRS = razonesSociales.filter(rs => rsIds.has(rs.id));
      setAssociatedRazonesSociales(associatedRS);
    } else {
      setAssociatedRazonesSociales([]);
    }
    setSelectedRazonSocialId('');
  }, [selectedClienteName, clientes, razonesSociales]);

  useEffect(() => {
    if (associatedRazonesSociales.length === 1) {
      setSelectedRazonSocialId(String(associatedRazonesSociales[0].id));
    }
  }, [associatedRazonesSociales]);

  const montoTotalConIVA = useMemo(() => {
    if (!monto || tipoIVA !== 'IVA 16%') return Number(monto);
    return Number(monto) * 1.16;
  }, [monto, tipoIVA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClienteName || !selectedRazonSocialId) {
      alert('Debe seleccionar un cliente y una razón social.');
      return;
    }

    const cliente = clientes.find(c => c.nombre === selectedClienteName && c.razonSocialId === Number(selectedRazonSocialId));
    if (!cliente) {
      alert('Error: No se pudo encontrar el cliente seleccionado.');
      return;
    }

    if (new Date(fechaTermino) < new Date(fechaInicio)) {
      alert('La fecha de término no puede ser anterior a la fecha de inicio.');
      return;
    }

    const newContrato = {
      clienteId: cliente.id,
      razonSocialId: Number(selectedRazonSocialId),
      nombreProyecto, folio, objeto,
      monto: parseFloat(String(monto)) || 0,
      moneda,
      tipoDeCambio: moneda === 'USD' ? parseFloat(String(tipoDeCambio)) || 0 : undefined,
      fechaInicio, fechaTermino, tipoContrato, tipoIVA,
      anticipoPorcentaje: parseFloat(String(anticipoPorcentaje)) || 0,
      fondoGarantiaPorcentaje: parseFloat(String(fondoGarantiaPorcentaje)) || 0,
      montoAnticipoOtorgado: ((parseFloat(String(monto)) || 0) * ((parseFloat(String(anticipoPorcentaje)) || 0) / 100)),
      estatus,
      fianzaAnticipo,
      penalizaciones,
    };

    await fetch('/api/contratos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContrato),
    });

    onContratoAdded();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Row 1 */}
      <div className="form-group">
        <label>Cliente</label>
        <select value={selectedClienteName} onChange={(e) => setSelectedClienteName(e.target.value)} required>
          <option value="" disabled>Seleccione un cliente</option>
          {uniqueClientNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {associatedRazonesSociales.length > 0 && (
        <div className="form-group">
          <label>Razón Social</label>
          <select
            value={selectedRazonSocialId}
            onChange={(e) => setSelectedRazonSocialId(e.target.value)}
            required
            disabled={associatedRazonesSociales.length === 1}
          >
            <option value="" disabled>Seleccione una Razón Social</option>
            {associatedRazonesSociales.map(rs => <option key={rs.id} value={rs.id}>{rs.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Nombre del Proyecto</label>
        <input type="text" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Folio de Contrato</label>
        <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} required />
      </div>

      {/* Row 2 */}
      <div className="form-group">
        <label>Monto Contratado</label>
        <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Moneda</label>
        <select value={moneda} onChange={(e) => setMoneda(e.target.value as any)} required>
          <option value="MXN">M.N.</option>
          <option value="USD">USD</option>
        </select>
      </div>
      {moneda === 'USD' && (
        <div className="form-group">
          <label>Tipo de Cambio (Referencia)</label>
          <input type="number" value={tipoDeCambio} onChange={(e) => setTipoDeCambio(e.target.value)} required />
        </div>
      )}

      {/* Row 3 */}
      <div className="form-group">
        <label>Fecha de Inicio</label>
        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Fecha de Término</label>
        <input type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Estatus</label>
        <select value={estatus} onChange={(e) => setEstatus(e.target.value as any)} required>
          <option value="Vigente">Vigente</option>
          <option value="Vencido">Vencido</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Row 4 */}
      <div className="form-group">
        <label>Tipo de Contrato</label>
        <select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value as any)} required>
          {tipoContratoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>% Anticipo</label>
        <input type="number" min="0" max="100" value={anticipoPorcentaje} onChange={(e) => setAnticipoPorcentaje(e.target.value)} />
      </div>
      <div className="form-group">
        <label>% Fondo de Garantía</label>
        <input type="number" min="0" max="100" value={fondoGarantiaPorcentaje} onChange={(e) => setFondoGarantiaPorcentaje(e.target.value)} />
      </div>

      {/* Row 5 */}
      <div className="form-group">
        <label>Tipo de IVA</label>
        <select value={tipoIVA} onChange={(e) => setTipoIVA(e.target.value as any)} required>
          <option value="IVA 16%">IVA 16%</option>
          <option value="Tasa 0%">Tasa 0%</option>
          <option value="No Aplica">No Aplica</option>
        </select>
      </div>
      <div className="form-group">
          <label>Monto Total (IVA Incluido)</label>
          <input type="text" readOnly value={`$${montoTotalConIVA.toLocaleString()}`} style={{backgroundColor: '#eee'}} />
      </div>

      {/* Row 6 */}
      <div className="form-group" style={{gridColumn: '1 / -1'}}>
        <label>Objeto del Contrato</label>
        <input type="text" value={objeto} onChange={(e) => setObjeto(e.target.value)} required />
      </div>

      {/* Row 7: Fianzas y Penalizaciones */}
      <div className="form-group" style={{gridColumn: '1 / -1'}}>
        <label>Fianza de Anticipo (Opcional)</label>
        <input type="text" value={fianzaAnticipo} onChange={(e) => setFianzaAnticipo(e.target.value)} placeholder="Ej. Folio de fianza, condiciones, etc." />
      </div>
      <div className="form-group" style={{gridColumn: '1 / -1'}}>
        <label>Penalizaciones (Opcional)</label>
        <textarea value={penalizaciones} onChange={(e) => setPenalizaciones(e.target.value)} placeholder="Ej. 1% por cada semana de retraso..."></textarea>
      </div>

      <button type="submit">Agregar Contrato</button>
    </form>
  );
};

export default ContratoForm;