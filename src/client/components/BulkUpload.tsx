import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { RazonSocial } from '../../types';

interface BulkUploadProps {
  razonesSociales: RazonSocial[];
  onUploadComplete: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ razonesSociales, onUploadComplete }) => {
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [selectedRSCliente, setSelectedRSCliente] = useState<string>('');
  const [selectedRSContrato, setSelectedRSContrato] = useState<string>('');

  const handleDownloadTemplate = (type: 'cliente' | 'contrato' | 'factura') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'cliente') {
      data = [{ nombre: '', rfc: '', direccion: '', contacto_nombre: '', contacto_telefono: '', contacto_email: '' }];
      filename = 'plantilla_clientes.xlsx';
    } else if (type === 'contrato') {
      data = [{ clienteNombre: '(Nombre del cliente existente)', nombreProyecto: '', folio: '', objeto: '', monto: 0, moneda: 'MXN', tipoDeCambio: 1, fechaInicio: 'DD/MM/AAAA', fechaTermino: 'DD/MM/AAAA', tipoContrato: 'Precio Unitario', tipoIVA: 'IVA 16%', anticipoPorcentaje: 0, fondoGarantiaPorcentaje: 0, estatus: 'Vigente' }];
      filename = 'plantilla_contratos.xlsx';
    } else { // Factura
        data = [{
            contratoFolio: '(Folio del contrato existente)',
            folioFactura: '',
            fechaEmision: 'DD/MM/AAAA',
            concepto: '',
            importeEstimacion: 0,
            amortizacionAnticipo: 0,
            fondoGarantia: 0,
            deductivaCargos: 0,
            estatus: 'Pendiente',
            comentarios: ''
        }];
        filename = 'plantilla_facturas.xlsx';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, filename);
  };

  const handleFileUpload = async (type: 'cliente' | 'contrato' | 'factura') => {
    let file, razonSocialId;
    if (type === 'cliente') {
        file = clientFile;
        razonSocialId = selectedRSCliente;
    } else if (type === 'contrato') {
        file = contractFile;
        razonSocialId = selectedRSContrato;
    } else {
        file = invoiceFile;
    }

    if (!file) {
      alert(`Por favor, selecciona un archivo de ${type}s.`);
      return;
    }
    if ((type === 'cliente' || type === 'contrato') && !razonSocialId) {
        alert('Por favor, selecciona una Razón Social.');
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

        alert(`Procesando ${jsonData.length} registro(s)...`);

        const endpoint = `/api/bulk/${type}s`;
        
        let body;
        if (type === 'cliente' || type === 'contrato') {
            body = { data: jsonData, razonSocialId };
        } else {
            body = jsonData;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error en la carga masiva: ${response.statusText}`);
        }

        alert(result.message || `¡Carga masiva de ${type}s completada con éxito!`);
        onUploadComplete();

      } catch (error: any) {
        console.error('Error procesando el archivo:', error);
        alert(`Hubo un error al procesar el archivo: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bulk-upload-container">
      <div className="upload-section">
        <h4>Clientes</h4>
        <p>Cargar clientes para una Razón Social específica.</p>
        <select value={selectedRSCliente} onChange={(e) => setSelectedRSCliente(e.target.value)}>
            <option value="">-- Seleccione Razón Social --</option>
            {razonesSociales.map(rs => <option key={rs.id} value={rs.id}>{rs.nombre}</option>)}
        </select>
        <button onClick={() => handleDownloadTemplate('cliente')}>Descargar Plantilla</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setClientFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleFileUpload('cliente')} disabled={!clientFile || !selectedRSCliente}>Cargar Clientes</button>
      </div>
      <div className="upload-section">
        <h4>Contratos</h4>
        <p>Cargar contratos para una Razón Social específica.</p>
        <select value={selectedRSContrato} onChange={(e) => setSelectedRSContrato(e.target.value)}>
            <option value="">-- Seleccione Razón Social --</option>
            {razonesSociales.map(rs => <option key={rs.id} value={rs.id}>{rs.nombre}</option>)}
        </select>
        <button onClick={() => handleDownloadTemplate('contrato')}>Descargar Plantilla</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleFileUpload('contrato')} disabled={!contractFile || !selectedRSContrato}>Cargar Contratos</button>
      </div>
      <div className="upload-section">
        <h4>Facturas</h4>
        <p>Cargar facturas para contratos existentes.</p>
        <button onClick={() => handleDownloadTemplate('factura')}>Descargar Plantilla</button>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleFileUpload('factura')} disabled={!invoiceFile}>Cargar Facturas</button>
      </div>
    </div>
  );
};

export default BulkUpload;
