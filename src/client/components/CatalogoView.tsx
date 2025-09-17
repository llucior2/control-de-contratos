import React from 'react';
import CatalogoConceptoList from './CatalogoConceptoList';
import ProcesoConstructivoList from './ProcesoConstructivoList';
import './CatalogoView.css';
import { CatalogoConcepto, ProcesoConstructivo } from '../../types'; // Import types

interface CatalogoViewProps {
  conceptos: CatalogoConcepto[];
  procesos: ProcesoConstructivo[];
  selectedConceptoId: number | null;
  onSelectConcepto: (concepto: CatalogoConcepto) => void;
  onAddConcepto: () => void;
  onEditConcepto: (concepto: CatalogoConcepto) => void;
  onDeleteConcepto: (id: number) => void;
  onAddProceso: () => void;
  onEditProceso: (proceso: ProcesoConstructivo) => void;
  onDeleteProceso: (id: number) => void;
}

const CatalogoView: React.FC<CatalogoViewProps> = ({
  conceptos,
  procesos,
  selectedConceptoId,
  onSelectConcepto,
  onAddConcepto,
  onEditConcepto,
  onDeleteConcepto,
  onAddProceso,
  onEditProceso,
  onDeleteProceso,
}) => {
    return (
        <div className="catalogo-view-container">
            <div className="catalogo-section">
                <h2>Catálogo de Conceptos</h2>
                <CatalogoConceptoList
                  conceptos={conceptos}
                  selectedId={selectedConceptoId}
                  onSelect={onSelectConcepto}
                  onAdd={onAddConcepto}
                  onEdit={onEditConcepto}
                  onDelete={onDeleteConcepto}
                />
            </div>
            <div className="catalogo-section">
                <h2>Procesos Constructivos</h2>
                <ProcesoConstructivoList
                  procesos={procesos}
                  onAdd={onAddProceso}
                  onEdit={onEditProceso}
                  onDelete={onDeleteProceso}
                />
            </div>
        </div>
    );
};

export default CatalogoView;