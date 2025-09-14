import { useState, useEffect } from 'react';
import { Contrato, Cliente, Factura, RazonSocial } from '../types';
import ContratoForm from './components/ContratoForm';
import ClienteForm from './components/ClienteForm';
import ContratoList from './components/ContratoList';
import ClienteList from './components/ClienteList';
import EditContratoModal from './components/EditContratoModal';
import ViewOptionsModal from './components/ViewOptionsModal';
import BulkUpload from './components/BulkUpload';
import ReportModal from './components/ReportModal';
import FacturaList from './components/FacturaList';
import FacturaForm from './components/FacturaForm';
import RazonSocialList from './components/RazonSocialList';
import RazonSocialForm from './components/RazonSocialForm';
import GlobalFilter from './components/GlobalFilter';
import './Layout.css';

const initialVisibleFields = {
  folio: true,
  monto: true,
  estatus: true,
  fechas: true,
  objeto: false,
  moneda: false,
  tipoDeCambio: false,
  tipoContrato: false,
  tipoIVA: false,
  montoTotalConIVA: false,
  anticipoPorcentaje: false,
  fondoGarantiaPorcentaje: false,
};

function App() {
  // Data States
  const [razonesSociales, setRazonesSociales] = useState<RazonSocial[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  // View & Modal States
  const [currentView, setCurrentView] = useState('contratos');
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [editingRazonSocial, setEditingRazonSocial] = useState<RazonSocial | null>(null);
  const [isFacturaFormOpen, setIsFacturaFormOpen] = useState(false);
  const [isRazonSocialFormOpen, setIsRazonSocialFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Filter & Search States
  const [selectedRazonSocialId, setSelectedRazonSocialId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'contratos' | 'clientes' | null>(null);
  const [visibleFields, setVisibleFields] = useState(initialVisibleFields);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setSearchTerm('');
  }, [currentView]);

  const fetchAllData = () => {
    fetchRazonesSociales();
    fetchContratos();
    fetchClientes();
    fetchFacturas();
  };

  const fetchRazonesSociales = async () => {
    const response = await fetch('/api/razonesSociales');
    const data = await response.json();
    setRazonesSociales(data);
  };

  const fetchContratos = async () => {
    const response = await fetch('/api/contratos');
    const data = await response.json();
    setContratos(data);
  };

  const fetchClientes = async () => {
    const response = await fetch('/api/clientes');
    const data = await response.json();
    setClientes(data);
  };

  const fetchFacturas = async () => {
    const response = await fetch('/api/facturas');
    const data = await response.json();
    setFacturas(data);
  };

  // --- Razon Social Handlers ---
  const handleSaveRazonSocial = async (rs: Omit<RazonSocial, 'id'> | RazonSocial) => {
    const isEditing = 'id' in rs;
    const endpoint = isEditing ? `/api/razonesSociales/${rs.id}` : '/api/razonesSociales';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rs),
    });
    setIsRazonSocialFormOpen(false);
    setEditingRazonSocial(null);
    fetchRazonesSociales();
  };

  const handleDeleteRazonSocial = async (id: number) => {
    if (window.confirm('¿Estás seguro? Eliminar una razón social no eliminará sus clientes o contratos asociados.')) {
      await fetch(`/api/razonesSociales/${id}`, { method: 'DELETE' });
      fetchRazonesSociales();
    }
  };

  const handleAddRazonSocialClick = () => {
    setEditingRazonSocial(null);
    setIsRazonSocialFormOpen(true);
  };

  const handleEditRazonSocialClick = (rs: RazonSocial) => {
    setEditingRazonSocial(rs);
    setIsRazonSocialFormOpen(true);
  };

  // --- Contrato Handlers ---
  const handleEditContrato = (contrato: Contrato) => setEditingContrato(contrato);

  const handleSaveContrato = async (updatedContrato: Contrato) => {
    await fetch(`/api/contratos/${updatedContrato.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedContrato),
    });
    setEditingContrato(null);
    fetchContratos();
  };

  const handleDeleteContrato = async (contratoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contrato?')) {
      await fetch(`/api/contratos/${contratoId}`, { method: 'DELETE' });
      fetchContratos();
    }
  };

  // --- Cliente Handlers ---
  const handleDeleteCliente = async (clienteId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      await fetch(`/api/clientes/${clienteId}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  // --- Factura Handlers ---
  const handleSaveFactura = async (factura: Omit<Factura, 'id'>) => {
    await fetch('/api/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factura),
    });
    setIsFacturaFormOpen(false);
    fetchFacturas();
  };

  // --- UI Handlers ---
  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setVisibleFields(prev => ({ ...prev, [name]: checked }));
  };

  const handleToggleReportModal = (type: 'contratos' | 'clientes') => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  // --- Filtering Logic ---
  const filteredClientes = clientes.filter(cliente => {
    if (selectedRazonSocialId === null) return true; // Show all if 'Ver Todas' is selected
    return cliente.razonSocialId === selectedRazonSocialId;
  });

  const filteredContratos = contratos.filter(contrato => {
    if (selectedRazonSocialId === null) return true; // Show all
    return contrato.razonSocialId === selectedRazonSocialId;
  });

  return (
    <div className="app-layout">
      <GlobalFilter
         razonesSociales={razonesSociales}
         selectedId={selectedRazonSocialId}
         onSelect={setSelectedRazonSocialId}
      />
      <div className="sidebar">
        <h1>Gestión de Contratos</h1>
        <ul className="sidebar-menu">
          <li><button onClick={() => setCurrentView('razonesSociales')}>Razones Sociales</button></li>
          <li><button onClick={() => setCurrentView('contratos')}>Contratos Vigentes</button></li>
          <li><button onClick={() => setCurrentView('clientes')}>Clientes</button></li>
          <li><button onClick={() => setCurrentView('facturacion')}>Facturación</button></li>
          <li><button onClick={() => setCurrentView('cargaMasiva')}>Carga Masiva</button></li>
        </ul>
      </div>
      <div className="main-content">

        
        {currentView === 'razonesSociales' && (
          <RazonSocialList
            razonesSociales={razonesSociales}
            onAdd={handleAddRazonSocialClick}
            onEdit={handleEditRazonSocialClick}
            onDelete={handleDeleteRazonSocial}
          />
        )}
        {currentView === 'contratos' && (
          <ContratoList
            contratos={filteredContratos}
            clientes={clientes}
            onAdd={() => setCurrentView('nuevoContrato')}
            onEdit={handleEditContrato}
            onDelete={handleDeleteContrato}
            visibleFields={visibleFields}
            onToggleViewOptions={() => setIsViewModalOpen(true)}
            onToggleReportModal={() => handleToggleReportModal('contratos')}
            searchTerm={searchTerm}
            onSearchChange={e => setSearchTerm(e.target.value)}
          />
        )}
        {currentView === 'clientes' && (
          <ClienteList
            clientes={filteredClientes}
            onAdd={() => setCurrentView('nuevoCliente')}
            onDelete={handleDeleteCliente}
            onToggleReportModal={() => handleToggleReportModal('clientes')}
            searchTerm={searchTerm}
            onSearchChange={e => setSearchTerm(e.target.value)}
          />
        )}
        {currentView === 'facturacion' && (
          <FacturaList 
            clientes={clientes} 
            facturas={facturas} 
            contratos={contratos} 
            onAddFactura={() => setIsFacturaFormOpen(true)}
          />
        )}
        {currentView === 'nuevoCliente' && <ClienteForm onClienteAdded={() => { fetchClientes(); setCurrentView('clientes'); }} razonSocialId={selectedRazonSocialId} />}
        {currentView === 'nuevoContrato' && <ContratoForm clientes={clientes} onContratoAdded={() => { fetchContratos(); setCurrentView('contratos'); }} razonSocialId={selectedRazonSocialId} />}
        {currentView === 'cargaMasiva' && <BulkUpload razonesSociales={razonesSociales} onUploadComplete={fetchAllData} />}
      </div>

      {/* --- Modals --- */}
      {editingContrato && (
        <EditContratoModal
          contrato={editingContrato}
          clientes={clientes}
          onClose={() => setEditingContrato(null)}
          onSave={handleSaveContrato}
        />
      )}
      {isFacturaFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setIsFacturaFormOpen(false)} className="close-btn">X</button>
            <FacturaForm onSave={handleSaveFactura} clientes={clientes} contratos={contratos} allFacturas={facturas} />
          </div>
        </div>
      )}
      {isRazonSocialFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RazonSocialForm
              onSave={handleSaveRazonSocial}
              onCancel={() => { setIsRazonSocialFormOpen(false); setEditingRazonSocial(null); }}
              existingRazonSocial={editingRazonSocial}
            />
          </div>
        </div>
      )}
      <ViewOptionsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        visibleFields={visibleFields}
        onVisibilityChange={handleVisibilityChange}
      />
      {isReportModalOpen && reportType && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportType={reportType}
          contratos={contratos}
          clientes={clientes}
        />
      )}
    </div>
  );
}

export default App;
