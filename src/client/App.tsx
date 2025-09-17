import { useState, useEffect } from 'react';
import { Contrato, Cliente, Factura, RazonSocial, Pago, OrdenDeCambio, CatalogoConcepto, ProcesoConstructivo } from '../types';
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
import PagoList from './components/PagoList';
import PagoForm from './components/PagoForm';
import OrdenDeCambioList from './components/OrdenDeCambioList';
import OrdenDeCambioForm from './components/OrdenDeCambioForm';
import './Layout.css';

// Placeholder for the new component
const CatalogoView = () => <div><h2>Catálogo de Conceptos y Procesos</h2><p>Próximamente...</p></div>;

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
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ordenesDeCambio, setOrdenesDeCambio] = useState<OrdenDeCambio[]>([]);
  const [catalogoConceptos, setCatalogoConceptos] = useState<CatalogoConcepto[]>([]);
  const [procesosConstructivos, setProcesosConstructivos] = useState<ProcesoConstructivo[]>([]);

  // View & Modal States
  const [currentView, setCurrentView] = useState('contratos');
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [editingRazonSocial, setEditingRazonSocial] = useState<RazonSocial | null>(null);
  const [isFacturaFormOpen, setIsFacturaFormOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [isPagoFormOpen, setIsPagoFormOpen] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [isOrdenDeCambioFormOpen, setIsOrdenDeCambioFormOpen] = useState(false);
  const [editingOrdenDeCambio, setEditingOrdenDeCambio] = useState<OrdenDeCambio | null>(null);
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
    fetchPagos();
    fetchOrdenesDeCambio();
    fetchCatalogoConceptos();
    fetchProcesosConstructivos();
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

  const fetchPagos = async () => {
    const response = await fetch('/api/pagos');
    const data = await response.json();
    setPagos(data);
  };

  const fetchOrdenesDeCambio = async () => {
    try {
        const response = await fetch('/api/ordenesDeCambio');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setOrdenesDeCambio(data);
    } catch (error) {
        console.error("Could not fetch ordenes de cambio:", error);
        setOrdenesDeCambio([]);
    }
  };

  const fetchCatalogoConceptos = async () => {
    try {
        const response = await fetch('/api/catalogoConceptos');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCatalogoConceptos(data);
    } catch (error) {
        console.error("Could not fetch catalogo conceptos:", error);
        setCatalogoConceptos([]);
    }
  };

  const fetchProcesosConstructivos = async () => {
    try {
        const response = await fetch('/api/procesosConstructivos');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setProcesosConstructivos(data);
    } catch (error) {
        console.error("Could not fetch procesos constructivos:", error);
        setProcesosConstructivos([]);
    }
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
  const handleAddFacturaClick = () => {
    setEditingFactura(null);
    setIsFacturaFormOpen(true);
  };

  const handleEditFacturaClick = (factura: Factura) => {
    setEditingFactura(factura);
    setIsFacturaFormOpen(true);
  };

  const handleDeleteFactura = async (facturaId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      await fetch(`/api/facturas/${facturaId}`, { method: 'DELETE' });
      fetchFacturas();
    }
  };

  const handleSaveFactura = async (factura: Omit<Factura, 'id'> | Factura) => {
    const isEditing = 'id' in factura;
    const endpoint = isEditing ? `/api/facturas/${factura.id}` : '/api/facturas';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factura),
    });
    setIsFacturaFormOpen(false);
    setEditingFactura(null);
    fetchFacturas();
  };

  const handleCloseFacturaForm = () => {
    setIsFacturaFormOpen(false);
    setEditingFactura(null);
  };

  // --- Pago Handlers ---
  const handleAddPagoClick = () => {
    setEditingPago(null);
    setIsPagoFormOpen(true);
  };

  const handleEditPagoClick = (pago: Pago) => {
    setEditingPago(pago);
    setIsPagoFormOpen(true);
  };

  const handleDeletePago = async (pagoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      await fetch(`/api/pagos/${pagoId}`, { method: 'DELETE' });
      fetchPagos();
    }
  };

  const handleSavePago = async (pago: Omit<Pago, 'id'> | Pago) => {
    const isEditing = 'id' in pago;
    const endpoint = isEditing ? `/api/pagos/${pago.id}` : '/api/pagos';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pago),
    });
    setIsPagoFormOpen(false);
    setEditingPago(null);
    fetchPagos();
  };

  const handleClosePagoForm = () => {
    setIsPagoFormOpen(false);
    setEditingPago(null);
  };

  // --- Orden de Cambio Handlers ---
  const handleAddOrdenDeCambioClick = () => {
    setEditingOrdenDeCambio(null);
    setIsOrdenDeCambioFormOpen(true);
  };

  const handleEditOrdenDeCambioClick = (orden: OrdenDeCambio) => {
    setEditingOrdenDeCambio(orden);
    setIsOrdenDeCambioFormOpen(true);
  };

  const handleDeleteOrdenDeCambio = async (ordenId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden de cambio?')) {
      await fetch(`/api/ordenesDeCambio/${ordenId}`, { method: 'DELETE' });
      fetchOrdenesDeCambio();
    }
  };

  const handleSaveOrdenDeCambio = async (orden: Omit<OrdenDeCambio, 'id'> | OrdenDeCambio) => {
    const isEditing = 'id' in orden;
    const endpoint = isEditing ? `/api/ordenesDeCambio/${orden.id}` : '/api/ordenesDeCambio';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orden),
    });
    setIsOrdenDeCambioFormOpen(false);
    setEditingOrdenDeCambio(null);
    fetchOrdenesDeCambio();
    fetchContratos(); // Also refetch contratos as the total amount might change
  };

  const handleCloseOrdenDeCambioForm = () => {
    setIsOrdenDeCambioFormOpen(false);
    setEditingOrdenDeCambio(null);
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
      <div className="sidebar">
        <h1>Gestión</h1>
        <div className="nav-category">
          <h3><i className="fas fa-folder-open"></i> Proyectos</h3>
          <button onClick={() => setCurrentView('contratos')}><i className="fas fa-file-signature"></i> Contratos</button>
          <button onClick={() => setCurrentView('ordenesDeCambio')}><i className="fas fa-exchange-alt"></i> Órdenes de Cambio</button>
          <button onClick={() => setCurrentView('facturacion')}><i className="fas fa-file-invoice-dollar"></i> Facturación</button>
          <button onClick={() => setCurrentView('pagos')}><i className="fas fa-hand-holding-usd"></i> Pagos</button>
        </div>
        <div className="nav-category">
          <h3><i className="fas fa-book"></i> Catálogos</h3>
          <button onClick={() => setCurrentView('clientes')}><i className="fas fa-users"></i> Clientes</button>
          <button onClick={() => setCurrentView('razonesSociales')}><i className="fas fa-building"></i> Razones Sociales</button>
          <button onClick={() => setCurrentView('catalogo')}><i className="fas fa-sitemap"></i> Conceptos y Procesos</button>
        </div>
        <div className="nav-category">
          <h3><i className="fas fa-tools"></i> Herramientas</h3>
          <button onClick={() => setCurrentView('cargaMasiva')}><i className="fas fa-upload"></i> Carga Masiva</button>
        </div>
      </div>
      <div className="main-content">
        <div className="main-content-header">
          <GlobalFilter
            razonesSociales={razonesSociales}
            selectedId={selectedRazonSocialId}
            onSelect={setSelectedRazonSocialId}
          />
        </div>

        
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
        {currentView === 'ordenesDeCambio' && (
          <OrdenDeCambioList
            ordenes={ordenesDeCambio}
            contratos={contratos}
            onAdd={handleAddOrdenDeCambioClick}
            onEdit={handleEditOrdenDeCambioClick}
            onDelete={handleDeleteOrdenDeCambio}
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
            onAddFactura={handleAddFacturaClick}
            onEditFactura={handleEditFacturaClick}
            onDeleteFactura={handleDeleteFactura}
          />
        )}
        {currentView === 'pagos' && (
          <PagoList 
            pagos={pagos}
            facturas={facturas}
            contratos={contratos}
            clientes={clientes}
            onAddPago={handleAddPagoClick}
            onEditPago={handleEditPagoClick}
            onDeletePago={handleDeletePago}
          />
        )}
        {currentView === 'catalogoConceptos' && <CatalogoView />}
        {currentView === 'nuevoCliente' && <ClienteForm onClienteAdded={() => { fetchClientes(); setCurrentView('clientes'); }} razonSocialId={selectedRazonSocialId} />}
        {currentView === 'nuevoContrato' && <ContratoForm clientes={clientes} razonesSociales={razonesSociales} onContratoAdded={() => { fetchContratos(); setCurrentView('contratos'); }} />}
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
            <button onClick={handleCloseFacturaForm} className="close-btn">X</button>
            <FacturaForm 
              onSave={handleSaveFactura} 
              clientes={clientes} 
              contratos={contratos} 
              allFacturas={facturas} 
              existingFactura={editingFactura}
            />
          </div>
        </div>
      )}
       {isPagoFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <PagoForm 
              onSave={handleSavePago} 
              onCancel={handleClosePagoForm}
              facturas={facturas} 
              existingPago={editingPago}
            />
          </div>
        </div>
      )}
      {isOrdenDeCambioFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <OrdenDeCambioForm 
              onSave={handleSaveOrdenDeCambio} 
              onCancel={handleCloseOrdenDeCambioForm}
              contratos={contratos} 
              existingOrden={editingOrdenDeCambio}
            />
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