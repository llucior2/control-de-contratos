import React from 'react';
import { RazonSocial } from '../../types';
import './RazonSocialList.css';

interface RazonSocialListProps {
  razonesSociales: RazonSocial[];
  onAdd: () => void;
  onEdit: (rs: RazonSocial) => void;
  onDelete: (id: number) => void;
}

const RazonSocialList: React.FC<RazonSocialListProps> = ({ razonesSociales, onAdd, onEdit, onDelete }) => {
  return (
    <div>
      <div className="list-header">
        <h2>Razones Sociales</h2>
        <button onClick={onAdd}>Nueva Razón Social</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RFC</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {razonesSociales.map(rs => (
            <tr key={rs.id}>
              <td>{rs.nombre}</td>
              <td>{rs.rfc}</td>
              <td>
                <div className="action-buttons-cell">
                  <button className="action-button edit" onClick={() => onEdit(rs)} title="Editar">✏️</button>
                  <button className="action-button delete" onClick={() => onDelete(rs.id)} title="Eliminar">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RazonSocialList;
