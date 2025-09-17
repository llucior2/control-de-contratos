import { useState, useEffect } from 'react';
import { Pago, Factura } from '../../types';

interface PagoFormProps {
  onSave: (pago: Omit<Pago, 'id'> | Pago) => void;
  onCancel: () => void;
  existingPago?: Pago | null;
  facturas: Factura[];
}

const PagoForm = ({ onSave, onCancel, existingPago, facturas }: PagoFormProps) => {
  const [facturaId, setFacturaId] = useState<string>('');
  const [fechaPago, setFechaPago] = useState('');
  const [montoPagado, setMontoPagado] = useState<number | string>('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    if (existingPago) {
      setFacturaId(String(existingPago.facturaId));
      setFechaPago(existingPago.fechaPago.split('T')[0]); // Format for date input
      setMontoPagado(existingPago.montoPagado);
      setMetodoPago(existingPago.metodoPago);
      setComentarios(existingPago.comentarios || '');
    } else {
      // Set today's date for new payments
      const today = new Date().toISOString().split('T')[0];
      setFechaPago(today);
    }
  }, [existingPago]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!facturaId || !montoPagado) {
        alert('Por favor, seleccione una factura y especifique un monto.');
        return;
    }

    const pagoData = {
      facturaId: Number(facturaId),
      fechaPago,
      montoPagado: Number(montoPagado),
      metodoPago,
      comentarios,
    };

    if (existingPago) {
      onSave({ ...existingPago, ...pagoData });
    } else {
      onSave(pagoData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{existingPago ? 'Editar' : 'Registrar'} Pago</h3>
      <div className="form-group">
        <label>Factura</label>
        <select value={facturaId} onChange={(e) => setFacturaId(e.target.value)} required>
          <option value="" disabled>-- Seleccione una Factura --</option>
          {facturas.map(f => (
            <option key={f.id} value={f.id}>
              {`Folio: ${f.folioFactura} (Contrato: ${f.contratoId})`}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Fecha de Pago</label>
        <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Monto Pagado</label>
        <input type="number" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Método de Pago</label>
        <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required>
          <option value="Transferencia">Transferencia</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Cheque">Cheque</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div className="form-group">
        <label>Comentarios</label>
        <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="submit" className="add-btn">Guardar Pago</button>
        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
      </div>
    </form>
  );
};

export default PagoForm;
