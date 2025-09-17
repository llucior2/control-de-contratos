import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { RazonSocial } from '../../types';
import './BulkUpload.css';

interface BulkUploadProps {
  razonesSociales: RazonSocial[];
  onUploadComplete: () => void;
}

interface UploadError {
  row: number;
  data: any;
  error: string;
}

interface UploadSummary {
  message: string;
  added: number;
  errors: UploadError[];
}

type EntityType = 'clientes' | 'contratos' | 'facturas' | 'pagos' | 'catalogoConceptos' | 'procesosConstructivos';

const BulkUpload: React.FC<BulkUploadProps> = ({ razonesSociales, onUploadComplete }) => {
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('clientes');
  const [file, setFile] = useState<File | null>(null);
  const [selectedRazonSocialId, setSelectedRazonSocialId] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const getTemplateHeaders = (type: EntityType) => {
    switch (type) {
      case 'clientes':
        return ['nombre', 'rfc', 'direccion', 'contacto_nombre', 'contacto_telefono', 'contacto_email'];
      case 'contratos':
        return ['clienteNombre', 'nombreProyecto', 'folio', 'objeto', 'monto', 'moneda', 'tipoDeCambio', 'fechaInicio', 'fechaTermino', 'tipoContrato', 'tipoIVA', 'anticipoPorcentaje', 'fondoGarantiaPorcentaje', 'estatus'];
      case 'facturas':
        return ['contratoFolio', 'folioFactura', 'fechaEmision', 'concepto', 'importeEstimacion', 'amortizacionAnticipo', 'fondoGarantia', 'deductivaCargos', 'comentarios'];
      case 'pagos':
        return ['facturaFolio', 'fecha', 'monto', 'metodoDePago', 'comentario'];
      case 'catalogoConceptos':
        return ['clave', 'nombre', 'unidad', 'precioUnitario'];
      case 'procesosConstructivos':
        return ['catalogoConceptoClave', 'nombre', 'descripcion', 'porcentaje'];
      default:
        return [];
    }
  };

  const handleDownloadTemplate = () => {
    const headers = getTemplateHeaders(selectedEntityType);
    if (headers.length === 0) {
      alert('No hay plantilla disponible para este tipo de entidad.');
      return;
    }

    const data = [headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {})]; // Empty row with headers
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, `plantilla_${selectedEntityType}.xlsx`);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Por favor, selecciona un archivo para cargar.');
      return;
    }
    if ((selectedEntityType === 'clientes' || selectedEntityType === 'contratos') && !selectedRazonSocialId) {
        alert('Por favor, selecciona una Razón Social para clientes o contratos.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('El archivo está vacío.');
          return;
        }

        let endpoint = '';
        let body: any = jsonData;

        switch (selectedEntityType) {
            case 'clientes':
                endpoint = '/api/bulk/clientes';
                body = { data: jsonData, razonSocialId: selectedRazonSocialId };
                break;
            case 'contratos':
                endpoint = '/api/bulk/contratos';
                body = { data: jsonData, razonSocialId: selectedRazonSocialId };
                break;
            case 'facturas':
                endpoint = '/api/bulk/facturas';
                break;
            case 'pagos':
                endpoint = '/api/bulk-upload/pagos';
                break;
            case 'catalogoConceptos':
                endpoint = '/api/bulk-upload/catalogo-conceptos';
                break;
            case 'procesosConstructivos':
                endpoint = '/api/bulk-upload/procesos-constructivos';
                break;
            default:
                alert('Tipo de entidad no soportado para carga masiva.');
                return;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result: UploadSummary = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error en la carga masiva: ${response.statusText}`);
        }
        
        setUploadSummary(result);
        setIsModalOpen(true);
        onUploadComplete();

      } catch (error: any) {
        console.error('Error procesando el archivo:', error);
        alert(`Hubo un error al procesar el archivo: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUploadSummary(null);
    setFile(null); // Clear selected file on modal close
  };

  const requiresRazonSocial = selectedEntityType === 'clientes' || selectedEntityType === 'contratos';

  return (
    <div className="bulk-upload-container">
      <h2>Carga Masiva de Datos</h2>

      <div className="upload-controls">
        <label htmlFor="entity-select">Seleccione tipo de entidad:</label>
        <select 
          id="entity-select"
          value={selectedEntityType}
          onChange={(e) => {
            setSelectedEntityType(e.target.value as EntityType);
            setFile(null); // Clear file when entity type changes
            setUploadSummary(null);
          }}
        >
          <option value="clientes">Clientes</option>
          <option value="contratos">Contratos</option>
          <option value="facturas">Facturas</option>
          <option value="pagos">Pagos</option>
          <option value="catalogoConceptos">Catálogo de Conceptos</option>
          <option value="procesosConstructivos">Procesos Constructivos</option>
        </select>

        {requiresRazonSocial && (
          <div className="razon-social-selector">
            <label htmlFor="razon-social-select">Seleccione Razón Social:</label>
            <select 
              id="razon-social-select"
              value={selectedRazonSocialId}
              onChange={(e) => setSelectedRazonSocialId(e.target.value)}
            >
              <option value="">-- Seleccione Razón Social --</option>
              {razonesSociales.map(rs => <option key={rs.id} value={rs.id}>{rs.nombre}</option>)}
            </select>
          </div>
        )}

        <button onClick={handleDownloadTemplate}>Descargar Plantilla</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <button 
          onClick={handleFileUpload}
          disabled={!file || (requiresRazonSocial && !selectedRazonSocialId)}
        >
          Cargar {selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}
        </button>
      </div>

      {isModalOpen && uploadSummary && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={closeModal} className="close-btn">X</button>
            <h3>Resumen de Carga</h3>
            <p>{uploadSummary.message}</p>
            {uploadSummary.errors && uploadSummary.errors.length > 0 && (
              <div>
                <h4>Registros con Errores:</h4>
                <table className="error-table">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Datos</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadSummary.errors.map((err, index) => (
                      <tr key={index}>
                        <td>{err.row}</td>
                        <td>{JSON.stringify(err.data)}</td>
                        <td>{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button onClick={closeModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;