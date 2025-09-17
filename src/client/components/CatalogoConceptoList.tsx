import { CatalogoConcepto } from '../../types';
import './CatalogoConceptoList.css';

interface CatalogoConceptoListProps {
  conceptos: CatalogoConcepto[];
  selectedId: number | null;
  onSelect: (concepto: CatalogoConcepto) => void;
  onAdd: () => void;
  onEdit: (concepto: CatalogoConcepto) => void;
  onDelete: (id: number) => void;
}

const CatalogoConceptoList = ({ conceptos, selectedId, onSelect, onAdd, onEdit, onDelete }: CatalogoConceptoListProps) => {
  return (
    <div className="concepto-list-container">
      <div className="list-actions">
        <button onClick={onAdd} className="add-btn">Nuevo Concepto</button>
      </div>
      <ul className="concepto-list">
        {conceptos.map(c => (
          <li 
            key={c.id} 
            className={`concepto-item ${selectedId === c.id ? 'selected' : ''}`}
          >
            <div className="item-info" onClick={() => onSelect(c)}>
              <span className="item-nombre">{c.nombre}</span>
              <span className="item-disciplina">{c.disciplina}</span>
            </div>
            <div className="item-actions">
              <button className="edit-btn-small" onClick={() => onEdit(c)}>Editar</button>
              <button className="delete-btn-small" onClick={() => onDelete(c.id)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CatalogoConceptoList;
