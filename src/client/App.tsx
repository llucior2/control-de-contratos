import { useState, useEffect } from 'react';
import { Contrato, Cliente } from '../types';
import ContratoForm from './components/ContratoForm';
import ClienteForm from './components/ClienteForm';
import ContratoList from './components/ContratoList';
import ClienteList from './components/ClienteList';
import EditContratoModal from './components/EditContratoModal';
import ViewOptionsModal from './components/ViewOptionsModal';
import BulkUpload from './components/BulkUpload';
import ReportModal from './components/ReportModal'; // Importar el nuevo modal
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
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'contratos' | 'clientes' | null>(null);
  const [visibleFields, setVisibleFields] = useState(initialVisibleFields);
  const [currentView, setCurrentView] = useState('contratos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(''); // Reset search term when view changes
  }, [currentView]);

  const fetchAllData = () => {
    fetchContratos();
    fetchClientes();
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

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleEditContrato = (contrato: Contrato) => {
    setEditingContrato(contrato);
  };

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
      await fetch(`/api/contratos/${contratoId}`, {
        method: 'DELETE',
      });
      fetchContratos();
    }
  };

  const handleDeleteCliente = async (clienteId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
      });
      fetchAllData();
    }
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setVisibleFields(prev => ({ ...prev, [name]: checked }));
  };

  const handleToggleReportModal = (type: 'contratos' | 'clientes') => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  const filteredContratos = contratos.filter(contrato => {
    const cliente = clientes.find(c => c.id === contrato.clienteId);
    const searchTermLower = searchTerm.toLowerCase();
    return (
      contrato.nombreProyecto.toLowerCase().includes(searchTermLower) ||
      contrato.folio.toLowerCase().includes(searchTermLower) ||
      (cliente && cliente.nombre.toLowerCase().includes(searchTermLower))
    );
  });

  const filteredClientes = clientes.filter(cliente => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(searchTermLower) ||
      (cliente.rfc && cliente.rfc.toLowerCase().includes(searchTermLower)) ||
      cliente.contactoPrincipal.nombre.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="app-layout">
      <div className="sidebar">
        <h1>Gestión de Contratos</h1>
        <ul className="sidebar-menu">
          <li><button onClick={() => setCurrentView('contratos')}>Contratos Vigentes</button></li>
          <li><button onClick={() => setCurrentView('clientes')}>Clientes</button></li>
          <li><button onClick={() => setCurrentView('nuevoCliente')}>Registrar Nuevo Cliente</button></li>
          <li><button onClick={() => setCurrentView('nuevoContrato')}>Registrar Nuevo Contrato</button></li>
          <li><button onClick={() => setCurrentView('cargaMasiva')}>Carga Masiva</button></li>
        </ul>
      </div>
      <div className="main-content">
        {currentView === 'contratos' && (
          <ContratoList
            contratos={filteredContratos}
            clientes={clientes}
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
            onDelete={handleDeleteCliente}
            onToggleReportModal={() => handleToggleReportModal('clientes')}
            searchTerm={searchTerm}
            onSearchChange={e => setSearchTerm(e.target.value)}
          />
        )}
        {currentView === 'nuevoCliente' && (
          <ClienteForm onClienteAdded={() => { fetchClientes(); setCurrentView('clientes'); }} />
        )}
        {currentView === 'nuevoContrato' && (
          <ContratoForm clientes={clientes} onContratoAdded={() => { fetchContratos(); setCurrentView('contratos'); }} />
        )}
        {currentView === 'cargaMasiva' && (
          <BulkUpload onUploadComplete={() => { fetchAllData(); setCurrentView('contratos'); }} />
        )}
      </div>

      {editingContrato && (
        <EditContratoModal
          contrato={editingContrato}
          clientes={clientes}
          onClose={() => setEditingContrato(null)}
          onSave={handleSaveContrato}
        />
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
