import { useState } from 'react';
import * as XLSX from 'xlsx';

const BulkUpload = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const handleDownloadTemplate = (type: 'cliente' | 'contrato') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'cliente') {
      data = [{ nombre: '', rfc: '', direccion: '', contacto_nombre: '', contacto_telefono: '', contacto_email: '' }];
      filename = 'plantilla_clientes.xlsx';
    } else {
      data = [{
        clienteNombre: '(Nombre del cliente existente)',
        nombreProyecto: '',
        folio: '',
        objeto: '',
        monto: 0,
        moneda: 'MXN',
        tipoDeCambio: 1,
        fechaInicio: 'DD/MM/AAAA',
        fechaTermino: 'DD/MM/AAAA',
        tipoContrato: 'Precio Unitario',
        tipoIVA: 'IVA 16%',
        anticipoPorcentaje: 0,
        fondoGarantiaPorcentaje: 0,
        estatus: 'Vigente'
      }];
      filename = 'plantilla_contratos.xlsx';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, filename);
  };

  const handleFileUpload = async (type: 'cliente' | 'contrato') => {
    const file = type === 'cliente' ? clientFile : contractFile;
    if (!file) {
      alert(`Por favor, selecciona un archivo de ${type}s.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          alert('El archivo está vacío.');
          return;
        }

        alert(`Procesando ${json.length} registro(s)...`);

        const endpoint = type === 'cliente' ? '/api/bulk/clientes' : '/api/bulk/contratos';
        
        const body = json.map((record: any) => {
            if (type === 'cliente') {
                return {
                    nombre: record.nombre,
                    rfc: record.rfc,
                    direccion: record.direccion,
                    contactoPrincipal: {
                        nombre: record.contacto_nombre,
                        telefono: record.contacto_telefono,
                        email: record.contacto_email
                    }
                };
            }
            return record;
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Error en la carga masiva: ${response.statusText}`);
        }

        const result = await response.json();

        alert(result.message || `¡Carga masiva de ${type}s completada con éxito!`);
        onUploadComplete();

      } catch (error) {
        console.error('Error procesando el archivo:', error);
        alert('Hubo un error al procesar el archivo. Revisa la consola para más detalles.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bulk-upload-container">
      <div className="upload-section">
        <h4>Clientes</h4>
        <button onClick={() => handleDownloadTemplate('cliente')}>Descargar Plantilla de Clientes</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setClientFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleFileUpload('cliente')} disabled={!clientFile}>Cargar Clientes</button>
      </div>
      <div className="upload-section">
        <h4>Contratos</h4>
        <button onClick={() => handleDownloadTemplate('contrato')}>Descargar Plantilla de Contratos</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleFileUpload('contrato')} disabled={!contractFile}>Cargar Contratos</button>
      </div>
    </div>
  );
};

export default BulkUpload;
