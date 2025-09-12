import { Cliente } from '../../types';

interface ClienteListProps {
  clientes: Cliente[];
  onDelete: (clienteId: number) => void;
  onToggleReportModal: () => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ClienteList = ({ clientes, onDelete, onToggleReportModal, searchTerm, onSearchChange }: ClienteListProps) => {
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
          <button onClick={onToggleReportModal} className="report-btn">Generar Reporte</button>
        </div>
      </div>
      <div className="card-container">
        {clientes.map(cliente => (
          <div key={cliente.id} className="card">
            <button onClick={() => onDelete(cliente.id)} className="delete-btn">Eliminar</button>
            <h4>{cliente.nombre}</h4>
            <p><strong>RFC:</strong> {cliente.rfc}</p>
            <p><strong>Dirección:</strong> {cliente.direccion}</p>
            <p><strong>Contacto:</strong> {cliente.contactoPrincipal.nombre}</p>
            <p><strong>Teléfono:</strong> {cliente.contactoPrincipal.telefono}</p>
            <p><strong>Email:</strong> {cliente.contactoPrincipal.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClienteList;
