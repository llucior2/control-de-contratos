import React from 'react';
import { RazonSocial } from '../../types';

interface GlobalFilterProps {
  razonesSociales: RazonSocial[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

const GlobalFilter: React.FC<GlobalFilterProps> = ({ razonesSociales, selectedId, onSelect }) => {
  return (
    <div className="global-filter-container">
      <label>Empresa:</label>
      <select 
        value={selectedId === null ? 'all' : selectedId}
        onChange={(e) => {
          const value = e.target.value;
          onSelect(value === 'all' ? null : parseInt(value, 10));
        }}
      >
        <option value="all">-- Ver Todas --</option>
        {razonesSociales.map(rs => (
          <option key={rs.id} value={rs.id}>{rs.nombre}</option>
        ))}
      </select>
    </div>
  );
};

export default GlobalFilter;
