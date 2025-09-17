import React, { useState, useEffect, useMemo } from 'react';
import { Factura, Cliente, Contrato } from '../../types';

interface FacturaFormProps {
  onSave: (factura: Omit<Factura, 'id'> | Factura) => void;
  clientes: Cliente[];
  contratos: Contrato[];
  existingFactura: Factura | null;
  allFacturas: Factura[]; // New prop: all invoices for validation
}

const initialFormData: Omit<Factura, 'id'> = {
    contratoId: 0,
    folioFactura: '',
    fechaEmision: '',
    concepto: '',
    importeEstimacion: 0,
    amortizacionAnticipo: 0,
    fondoGarantia: 0,
    deductivaCargos: 0,
    estatus: 'Pendiente',
    comentarios: '',
};

const FacturaForm: React.FC<FacturaFormProps> = ({ onSave, clientes, contratos, existingFactura, allFacturas }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isAmortizacionManual, setIsAmortizacionManual] = useState(false);
  const [isFondoGarantiaManual, setIsFondoGarantiaManual] = useState(false);

  // Populate form data if editing an existing factura
  useEffect(() => {
    if (existingFactura) {
      setFormData({
        contratoId: existingFactura.contratoId,
        folioFactura: existingFactura.folioFactura,
        fechaEmision: existingFactura.fechaEmision,
        concepto: existingFactura.concepto,
        importeEstimacion: existingFactura.importeEstimacion,
        amortizacionAnticipo: existingFactura.amortizacionAnticipo,
        fondoGarantia: existingFactura.fondoGarantia,
        deductivaCargos: existingFactura.deductivaCargos,
        estatus: existingFactura.estatus,
        comentarios: existingFactura.comentarios,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [existingFactura]);

  const selectedContrato = useMemo(() => {
      return contratos.find(c => c.id === formData.contratoId);
  }, [formData.contratoId, contratos]);

  // Automatic calculation of Amortizacion and Fondo de Garantia
  useEffect(() => {
    if (selectedContrato && formData.importeEstimacion !== undefined && !existingFactura) {
      const importe = Number(formData.importeEstimacion) || 0;
      const anticipoPorcentaje = Number(selectedContrato.anticipoPorcentaje) || 0;
      const fondoGarantiaPorcentaje = Number(selectedContrato.fondoGarantiaPorcentaje) || 0;

      const calculatedAmortizacion = importe * (anticipoPorcentaje / 100);
      const calculatedFondoGarantia = importe * (fondoGarantiaPorcentaje / 100);

      setFormData(prev => ({
        ...prev,
        amortizacionAnticipo: calculatedAmortizacion,
        fondoGarantia: calculatedFondoGarantia,
      }));
    }
  }, [selectedContrato, formData.importeEstimacion, existingFactura]);

  // Validation for Amortizacion and Fondo de Garantia
  useEffect(() => {
    if (selectedContrato) {
      const totalContrato = Number(selectedContrato.monto) || 0;
      const anticipoContrato = totalContrato * (Number(selectedContrato.anticipoPorcentaje) / 100);
      const fondoGarantiaContrato = totalContrato * (Number(selectedContrato.fondoGarantiaPorcentaje) / 100);

      const facturasDelContrato = allFacturas.filter(f => f.contratoId === selectedContrato.id && f.id !== existingFactura?.id);
      const sumAmortizacionExistente = facturasDelContrato.reduce((sum, f) => sum + (Number(f.amortizacionAnticipo) || 0), 0);
      const sumFondoGarantiaExistente = facturasDelContrato.reduce((sum, f) => sum + (Number(f.fondoGarantia) || 0), 0);

      const nuevaAmortizacionTotal = sumAmortizacionExistente + (Number(formData.amortizacionAnticipo) || 0);
      const nuevoFondoGarantiaTotal = sumFondoGarantiaExistente + (Number(formData.fondoGarantia) || 0);

      if (nuevaAmortizacionTotal > anticipoContrato + 0.01) { // Add a small tolerance for floating point
        setIsAmortizacionManual(true);
        alert(`Advertencia: La amortización total (${nuevaAmortizacionTotal.toLocaleString()}) excede el anticipo del contrato (${anticipoContrato.toLocaleString()}). Se ha habilitado la edición manual.`);
      } else {
        setIsAmortizacionManual(false);
      }

      if (nuevoFondoGarantiaTotal > fondoGarantiaContrato + 0.01) {
        setIsFondoGarantiaManual(true);
        alert(`Advertencia: El fondo de garantía total (${nuevoFondoGarantiaTotal.toLocaleString()}) excede el fondo de garantía del contrato (${fondoGarantiaContrato.toLocaleString()}). Se ha habilitado la edición manual.`);
      } else {
        setIsFondoGarantiaManual(false);
      }
    }
  }, [formData.contratoId, formData.amortizacionAnticipo, formData.fondoGarantia, selectedContrato, allFacturas, existingFactura]);

  const { subtotal, iva, total } = useMemo(() => {
    const importe = Number(formData.importeEstimacion) || 0;
    const amortizacion = Number(formData.amortizacionAnticipo) || 0;
    const fondo = Number(formData.fondoGarantia) || 0;
    const deductiva = Number(formData.deductivaCargos) || 0;
    const sub = importe - amortizacion - fondo - deductiva;

    let ivaCalc = 0;
    if (selectedContrato?.tipoIVA === 'IVA 16%') {
        ivaCalc = sub * 0.16;
    }

    const tot = sub + ivaCalc;
    return { subtotal: sub, iva: ivaCalc, total: tot };
  }, [formData, selectedContrato]);

  const handleContratoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contratoId = parseInt(e.target.value, 10);
    setFormData({ ...formData, contratoId });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <h3 style={{ gridColumn: '1 / -1' }}>{existingFactura ? 'Editar' : 'Registrar Nueva'} Factura</h3>

      <div style={{ gridColumn: '1 / -1' }}>
        <label>Proyecto (Contrato)</label>
        <select name="contratoId" onChange={handleContratoChange} value={formData.contratoId} required>
            <option value={0}>-- Seleccione un Proyecto --</option>
            {contratos.map(contrato => (
                <option key={contrato.id} value={contrato.id}>{contrato.nombreProyecto} ({clientes.find(c => c.id === contrato.clienteId)?.nombre})</option>
            ))}
        </select>
      </div>

      <div>
        <label>Folio de la Factura</label>
        <input type="text" name="folioFactura" value={formData.folioFactura} onChange={handleChange} required />
      </div>
       <div>
        <label>Fecha de Emisión</label>
        <input type="date" name="fechaEmision" value={formData.fechaEmision} onChange={handleChange} required />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label>Concepto</label>
        <input type="text" name="concepto" value={formData.concepto} onChange={handleChange} required />
      </div>

      <div>
        <label>Importe de Estimación</label>
        <input type="number" name="importeEstimacion" value={formData.importeEstimacion} onChange={handleChange} required />
      </div>
      <div>
        <label>Amortización de Anticipo</label>
        <input type="number" name="amortizacionAnticipo" value={formData.amortizacionAnticipo} onChange={handleChange} readOnly={!isAmortizacionManual} />
        {isAmortizacionManual && <p style={{color: 'red', fontSize: '0.8em'}}>¡Excede el anticipo del contrato! Edición manual habilitada.</p>}
      </div>
      <div>
        <label>Fondo de Garantía</label>
        <input type="number" name="fondoGarantia" value={formData.fondoGarantia} onChange={handleChange} readOnly={!isFondoGarantiaManual} />
        {isFondoGarantiaManual && <p style={{color: 'red', fontSize: '0.8em'}}>¡Excede el fondo de garantía del contrato! Edición manual habilitada.</p>}
      </div>
      <div>
        <label>Deductiva por Cargos</label>
        <input type="number" name="deductivaCargos" value={formData.deductivaCargos} onChange={handleChange} />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <h4>Cálculos:</h4>
        <p><strong>Subtotal:</strong> {subtotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        <p><strong>IVA ({selectedContrato?.tipoIVA || 'N/A'}):</strong> {iva.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        <p><strong>Total:</strong> {total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label>Comentarios</label>
        <textarea name="comentarios" value={formData.comentarios} onChange={handleChange}></textarea>
      </div>
      
      <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
        <button type="submit">Guardar Factura</button>
      </div>
    </form>
  );
};

export default FacturaForm;
