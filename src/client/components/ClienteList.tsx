import { Cliente } from '../../types';

interface ClienteListProps {
  clientes: Cliente[];
  onAdd: () => void;
  onDelete: (clienteId: number) => void;
  onToggleReportModal: () => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ClienteList = ({ clientes, onAdd, onDelete, onToggleReportModal, searchTerm, onSearchChange }: ClienteListProps) => {
  return (
    <div>
      <div className="list-header">
        <h2>Clientes Registrados</h2>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Buscar por nombre, RFC, contacto..."
            value={searchTerm}
            onChange={onSearchChange}
            className="search-input"
          />
          <button onClick={onAdd} className="add-btn">Nuevo Cliente</button>
          <button onClick={onToggleReportModal} className="report-btn">Generar Reporte</button>
        </div>
      </div>
      <div className="card-container">
        {clientes && clientes.length > 0 ? (
          clientes.map(cliente => {
            // Ensure contactoPrincipal exists for rendering to prevent crashes from old data
            const safeCliente = {
              ...cliente,
              contactoPrincipal: cliente.contactoPrincipal || { nombre: '', telefono: '', email: '' }
            };

            return (
              <div key={safeCliente.id} className="card">
                <button onClick={() => onDelete(safeCliente.id)} className="delete-btn">Eliminar</button>
                <h4>{safeCliente.nombre ?? 'Nombre no disponible'}</h4>
                <p><strong>RFC:</strong> {safeCliente.rfc ?? 'N/A'}</p>
                <p><strong>Dirección:</strong> {safeCliente.direccion ?? 'N/A'}</p>
                <p><strong>Contacto:</strong> {safeCliente.contactoPrincipal.nombre ?? 'N/A'}</p>
                <p><strong>Teléfono:</strong> {safeCliente.contactoPrincipal.telefono ?? 'N/A'}</p>
                <p><strong>Email:</strong> {safeCliente.contactoPrincipal.email ?? 'N/A'}</p>
              </div>
            );
          })
        ) : (
          <p className="no-results">No se encontraron clientes que coincidan con la búsqueda o el filtro aplicado.</p>
        )}
      </div>
    </div>
  );
};

export default ClienteList;