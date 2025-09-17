import { OrdenDeCambio, Contrato } from '../../types';

interface OrdenDeCambioListProps {
  ordenes: OrdenDeCambio[];
  contratos: Contrato[];
  onAdd: () => void;
  onEdit: (orden: OrdenDeCambio) => void;
  onDelete: (ordenId: number) => void;
}

const OrdenDeCambioList = ({ ordenes, contratos, onAdd, onEdit, onDelete }: OrdenDeCambioListProps) => {

  const getContratoFolio = (contratoId: number) => {
    const contrato = contratos.find(c => c.id === contratoId);
    return contrato ? contrato.folio : 'N/A';
  };

  return (
    <div className="pago-list-container"> {/* Reusing pago-list styles for consistency */}
      <div className="list-header">
        <h2>Órdenes de Cambio</h2>
        <button onClick={onAdd} className="add-btn">Nueva Orden de Cambio</button>
      </div>
      <table className="pago-table"> {/* Reusing pago-table styles */}
        <thead>
          <tr>
            <th>ID</th>
            <th>Contrato Afectado</th>
            <th>Descripción</th>
            <th>Monto Adicional/Deductivo</th>
            <th>Nueva Fecha de Término</th>
            <th>Fecha de Aprobación</th>
            <th>Autorizado Por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map(orden => (
            <tr key={orden.id}>
              <td>{orden.id}</td>
              <td>{getContratoFolio(orden.contratoId)}</td>
              <td>{orden.descripcion}</td>
              <td>{orden.montoAdicionalDeduccion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
              <td>{orden.nuevaFechaTermino || 'Sin cambios'}</td>
              <td>{orden.fechaAprobacion}</td>
              <td>{orden.autorizadoPor}</td>
              <td>
                <button className="edit-btn-small" onClick={() => onEdit(orden)}>Editar</button>
                <button className="delete-btn-small" onClick={() => onDelete(orden.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {ordenes.length === 0 && <p className="no-results">No hay órdenes de cambio registradas.</p>}
    </div>
  );
};

export default OrdenDeCambioList;
