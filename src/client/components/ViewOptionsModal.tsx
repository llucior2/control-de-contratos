import React from 'react';

interface ViewOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleFields: Record<string, boolean>;
  onVisibilityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  folio: 'Folio',
  monto: 'Monto (antes de IVA)',
  estatus: 'Estatus',
  fechas: 'Fechas',
  objeto: 'Alcance Contratado',
  moneda: 'Moneda',
  tipoDeCambio: 'T.C.',
  tipoContrato: 'Tipo de Contrato',
  tipoIVA: 'IVA',
  montoTotalConIVA: 'Monto Total (con IVA)',
  anticipoPorcentaje: '% Anticipo',
  fondoGarantiaPorcentaje: '% F. Garantía',
};

const ViewOptionsModal = ({ isOpen, onClose, visibleFields, onVisibilityChange }: ViewOptionsModalProps) => {
  if (!isOpen) return null;

  const handleGenerateExcel = async () => {
    // Funcionalidad futura
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Configurar Campos Visibles</h2>
        <div className="view-options-modal-grid">
          {Object.keys(visibleFields).map(field => (
            <label key={field} className="view-option-label">
              <input
                type="checkbox"
                name={field}
                checked={visibleFields[field]}
                onChange={onVisibilityChange}
              />
              {FIELD_LABELS[field] || field}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={handleGenerateExcel} className="save-btn" disabled>Generar Excel</button>
          <button onClick={onClose} className="cancel-btn">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ViewOptionsModal;