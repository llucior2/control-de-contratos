import { ProcesoConstructivo } from '../../types';
import './ProcesoConstructivoList.css';

interface ProcesoConstructivoListProps {
  procesos: ProcesoConstructivo[];
  onAdd: () => void;
  onEdit: (proceso: ProcesoConstructivo) => void;
  onDelete: (id: number) => void;
}

const ProcesoConstructivoList = ({ procesos, onAdd, onEdit, onDelete }: ProcesoConstructivoListProps) => {
  const totalPorcentaje = procesos.reduce((sum, p) => sum + p.porcentaje, 0);

  return (
    <div className="proceso-list-container">
      <div className="list-actions">
        <button onClick={onAdd} className="add-btn">Nuevo Proceso</button>
      </div>
      <ul className="proceso-list">
        {procesos.map(p => (
          <li key={p.id} className="proceso-item">
            <span className="item-nombre">{p.nombre}</span>
            <span className="item-porcentaje">{p.porcentaje}%</span>
            <div className="item-actions">
              <button className="edit-btn-small" onClick={() => onEdit(p)}>Editar</button>
              <button className="delete-btn-small" onClick={() => onDelete(p.id)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      <div className={`total-footer ${totalPorcentaje !== 100 ? 'invalid' : ''}`}>
        <strong>Total: {totalPorcentaje.toFixed(2)}%</strong>
        {totalPorcentaje !== 100 && (
          <span className="error-message">La suma de los porcentajes debe ser 100%</span>
        )}
      </div>
    </div>
  );
};

export default ProcesoConstructivoList;
