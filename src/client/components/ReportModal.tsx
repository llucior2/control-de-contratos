import { useState, useEffect } from 'react';
import { Contrato, Cliente } from '../../types';
import './ReportModal.css'; // Importar los nuevos estilos

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'contratos' | 'clientes';
  contratos: Contrato[];
  clientes: Cliente[];
}

// Definición de las columnas disponibles para cada tipo de reporte
const ALL_CONTRATO_FIELDS = {
  folio: 'Folio',
  nombreProyecto: 'Nombre del Proyecto',
  clienteNombre: 'Cliente',
  objeto: 'Alcance Contratado',
  monto: 'Monto (sin IVA)',
  montoTotalConIVA: 'Monto Total (con IVA)',
  moneda: 'Moneda',
  tipoDeCambio: 'Tipo de Cambio',
  fechaInicio: 'Fecha de Inicio',
  fechaTermino: 'Fecha de Término',
  tipoContrato: 'Tipo de Contrato',
  tipoIVA: 'Tipo de IVA',
  anticipoPorcentaje: '% Anticipo',
  fondoGarantiaPorcentaje: '% Fondo de Garantía',
  estatus: 'Estatus',
};

const ALL_CLIENTE_FIELDS = {
  nombre: 'Nombre',
  rfc: 'RFC',
  direccion: 'Dirección',
  contactoPrincipalNombre: 'Contacto Principal',
  contactoPrincipalTelefono: 'Teléfono de Contacto',
  contactoPrincipalEmail: 'Email de Contacto',
};


const ReportModal = ({ isOpen, onClose, reportType, contratos, clientes }: ReportModalProps) => {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});

  const isContratoReport = reportType === 'contratos';
  const availableFields = isContratoReport ? ALL_CONTRATO_FIELDS : ALL_CLIENTE_FIELDS;

  useEffect(() => {
    // Inicializar todos los campos como seleccionados cuando el modal se abre o cambia el tipo
    const initialSelection = Object.keys(availableFields).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedFields(initialSelection);
  }, [isOpen, reportType]);


  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSelectedFields(prev => ({ ...prev, [name]: checked }));
  };

  const handleGenerateReport = async () => {
    const columns = Object.entries(selectedFields)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => ({
        header: availableFields[key as keyof typeof availableFields],
        key: key,
      }));

    let data: any[] = [];
    if (isContratoReport) {
        const clienteMap = new Map(clientes.map(c => [c.id, c.nombre]));
        data = contratos.map(c => ({
            ...c,
            clienteNombre: clienteMap.get(c.clienteId) || 'Desconocido',
            montoTotalConIVA: c.tipoIVA === 'IVA 16%' ? c.monto * 1.16 : c.monto,
        }));
    } else {
        data = clientes.map(c => ({
            ...c,
            contactoPrincipalNombre: c.contactoPrincipal.nombre,
            contactoPrincipalTelefono: c.contactoPrincipal.telefono,
            contactoPrincipalEmail: c.contactoPrincipal.email,
        }));
    }

    const reportData = {
        title: `Reporte de ${reportType}`,
        columns: columns, // Enviar el array de objetos { header, key }
        rows: data       // Enviar el array de datos original
    };

    try {
        const response = await fetch('/api/reporte/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            throw new Error('Error al generar el reporte');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte de ${reportType}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        onClose(); // Cerrar el modal después de descargar

    } catch (error) {
        console.error('Error en la generación del reporte:', error);
        alert('No se pudo generar el reporte.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Generar Reporte de {isContratoReport ? 'Contratos' : 'Clientes'}</h2>
        
        <div className="report-columns-selection">
            <h4>Selecciona las columnas a incluir:</h4>
            <div className="checkbox-grid">
                {Object.entries(availableFields).map(([key, label]) => (
                <div key={key}>
                    <input
                    type="checkbox"
                    id={`field-${key}`}
                    name={key}
                    checked={selectedFields[key] || false}
                    onChange={handleFieldChange}
                    />
                    <label htmlFor={`field-${key}`}>{label}</label>
                </div>
                ))}
            </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleGenerateReport} className="save-btn">Generar Excel</button>
          <button onClick={onClose} className="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
