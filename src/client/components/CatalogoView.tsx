import React from 'react';
import CatalogoConceptoList from './CatalogoConceptoList';
import ProcesoConstructivoList from './ProcesoConstructivoList';
import './CatalogoView.css';

const CatalogoView: React.FC = () => {
    return (
        <div className="catalogo-view-container">
            <div className="catalogo-section">
                <h2>Catálogo de Conceptos</h2>
                <CatalogoConceptoList />
            </div>
            <div className="catalogo-section">
                <h2>Procesos Constructivos</h2>
                <ProcesoConstructivoList />
            </div>
        </div>
    );
};

export default CatalogoView;