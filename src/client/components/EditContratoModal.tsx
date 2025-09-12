import { useState, useEffect, useMemo } from 'react';
import { Contrato, TipoContrato, Cliente } from '../../types';
import './EditContratoModal.css';

const tipoContratoOptions: TipoContrato[] = [
  'Precio Unitario',
  'Precio Alzado',
  'Precio máximo garantizado',
  'Precio Alzado en base a Precios Unitarios',
  'Precio Alzado Máximo Garantizado',
  'Orden de trabajo',
  'Orden de Compra'
];

interface EditContratoModalProps {
  contrato: Contrato | null;
  clientes: Cliente[];
  onClose: () => void;
  onSave: (updatedContrato: Contrato) => void;
}

const EditContratoModal = ({ contrato, clientes, onClose, onSave }: EditContratoModalProps) => {
  const [formData, setFormData] = useState<Contrato | null>(null);

  useEffect(() => {
    setFormData(contrato);
  }, [contrato]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    if (name === 'clienteId' || name === 'monto' || name === 'tipoDeCambio' || name === 'anticipoPorcentaje' || name === 'fondoGarantiaPorcentaje') {
        parsedValue = Number(value);
    }
    setFormData(prev => prev ? { ...prev, [name]: parsedValue } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (new Date(formData.fechaTermino) < new Date(formData.fechaInicio)) {
      alert('La fecha de término no puede ser anterior a la fecha de inicio.');
      return;
    }
    onSave(formData);
  };

  const montoTotalConIVA = useMemo(() => {
    if (!formData?.monto || formData?.tipoIVA !== 'IVA 16%') return Number(formData?.monto || 0);
    return Number(formData.monto) * 1.16;
  }, [formData]);


  if (!contrato || !formData) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Editar Contrato: {contrato.nombreProyecto}</h2>
        <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
                <label>Cliente</label>
                <select name="clienteId" value={formData.clienteId} onChange={handleChange} required>
                    <option value={0}>Desconocido</option>
                    {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Nombre del Proyecto</label>
                <input type="text" name="nombreProyecto" value={formData.nombreProyecto} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Folio de Contrato</label>
                <input type="text" name="folio" value={formData.folio} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Monto Contratado</label>
                <input type="number" name="monto" value={formData.monto} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Moneda</label>
                <select name="moneda" value={formData.moneda} onChange={handleChange} required>
                    <option value="MXN">M.N.</option>
                    <option value="USD">USD</option>
                </select>
            </div>
            {formData.moneda === 'USD' && (
                <div className="form-group">
                <label>Tipo de Cambio</label>
                <input type="number" name="tipoDeCambio" value={formData.tipoDeCambio || ''} onChange={handleChange} required />
                </div>
            )}
            <div className="form-group">
                <label>Fecha de Inicio</label>
                <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Fecha de Término</label>
                <input type="date" name="fechaTermino" value={formData.fechaTermino} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Estatus</label>
                <select name="estatus" value={formData.estatus} onChange={handleChange} required>
                    <option value="Vigente">Vigente</option>
                    <option value="Vencido">Vencido</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
            </div>
            <div className="form-group">
                <label>Tipo de Contrato</label>
                <select name="tipoContrato" value={formData.tipoContrato} onChange={handleChange} required>
                    {tipoContratoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>% Anticipo</label>
                <input type="number" name="anticipoPorcentaje" value={formData.anticipoPorcentaje} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>% Fondo de Garantía</label>
                <input type="number" name="fondoGarantiaPorcentaje" value={formData.fondoGarantiaPorcentaje} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Tipo de IVA</label>
                <select name="tipoIVA" value={formData.tipoIVA} onChange={handleChange} required>
                    <option value="IVA 16%">IVA 16%</option>
                    <option value="Tasa 0%">Tasa 0%</option>
                    <option value="No Aplica">No Aplica</option>
                </select>
            </div>
            <div className="form-group">
                <label>Monto Total (IVA Incluido)</label>
                <input type="text" readOnly value={`$${montoTotalConIVA.toLocaleString()}`} style={{backgroundColor: '#eee'}} />
            </div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label>Objeto del Contrato</label>
                <input type="text" name="objeto" value={formData.objeto} onChange={handleChange} required />
            </div>
            <div className="modal-actions">
                <button type="submit" className="save-btn">Guardar Cambios</button>
                <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditContratoModal;
