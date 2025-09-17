import { useState, useEffect } from 'react';
import { OrdenDeCambio, Contrato } from '../../types';

interface OrdenDeCambioFormProps {
  onSave: (orden: Omit<OrdenDeCambio, 'id'> | OrdenDeCambio) => void;
  onCancel: () => void;
  existingOrden?: OrdenDeCambio | null;
  contratos: Contrato[];
}

const OrdenDeCambioForm = ({ onSave, onCancel, existingOrden, contratos }: OrdenDeCambioFormProps) => {
  const [contratoId, setContratoId] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [montoAdicionalDeduccion, setMontoAdicionalDeduccion] = useState<number | string>('');
  const [nuevaFechaTermino, setNuevaFechaTermino] = useState<string>('');
  const [fechaAprobacion, setFechaAprobacion] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');

  useEffect(() => {
    if (existingOrden) {
      setContratoId(String(existingOrden.contratoId));
      setDescripcion(existingOrden.descripcion);
      setMontoAdicionalDeduccion(existingOrden.montoAdicionalDeduccion);
      setNuevaFechaTermino(existingOrden.nuevaFechaTermino?.split('T')[0] || '');
      setFechaAprobacion(existingOrden.fechaAprobacion.split('T')[0]);
      setAutorizadoPor(existingOrden.autorizadoPor);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFechaAprobacion(today);
    }
  }, [existingOrden]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contratoId || !descripcion || !montoAdicionalDeduccion) {
        alert('Por favor, seleccione un contrato, añada una descripción y un monto.');
        return;
    }

    const ordenData = {
      contratoId: Number(contratoId),
      descripcion,
      montoAdicionalDeduccion: Number(montoAdicionalDeduccion),
      nuevaFechaTermino: nuevaFechaTermino || undefined,
      fechaAprobacion,
      autorizadoPor,
    };

    if (existingOrden) {
      onSave({ ...existingOrden, ...ordenData });
    } else {
      onSave(ordenData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{existingOrden ? 'Editar' : 'Nueva'} Orden de Cambio</h3>
      <div className="form-group">
        <label>Contrato Afectado</label>
        <select value={contratoId} onChange={(e) => setContratoId(e.target.value)} required>
          <option value="" disabled>-- Seleccione un Contrato --</option>
          {contratos.map(c => (
            <option key={c.id} value={c.id}>
              {`Folio: ${c.folio} (${c.nombreProyecto})`}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{gridColumn: '1 / -1'}}>
        <label>Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Monto Adicional / Deductivo</label>
        <input type="number" value={montoAdicionalDeduccion} onChange={(e) => setMontoAdicionalDeduccion(e.target.value)} required placeholder="Usar negativos para deducción" />
      </div>
       <div className="form-group">
        <label>Autorizado Por</label>
        <input type="text" value={autorizadoPor} onChange={(e) => setAutorizadoPor(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Fecha de Aprobación</label>
        <input type="date" value={fechaAprobacion} onChange={(e) => setFechaAprobacion(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Nueva Fecha de Término (Opcional)</label>
        <input type="date" value={nuevaFechaTermino} onChange={(e) => setNuevaFechaTermino(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="submit" className="add-btn">Guardar Orden</button>
        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
      </div>
    </form>
  );
};

export default OrdenDeCambioForm;
