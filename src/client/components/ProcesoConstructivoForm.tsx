import React, { useState, useEffect } from 'react';
import { ProcesoConstructivo, CatalogoConcepto } from '../../types';

interface ProcesoConstructivoFormProps {
  onSave: (proceso: Omit<ProcesoConstructivo, 'id'> | ProcesoConstructivo) => void;
  onCancel: () => void;
  existingProceso?: ProcesoConstructivo | null;
  catalogoConceptos: CatalogoConcepto[];
}

const ProcesoConstructivoForm: React.FC<ProcesoConstructivoFormProps> = ({
  onSave,
  onCancel,
  existingProceso,
  catalogoConceptos,
}) => {
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [catalogoConceptoId, setCatalogoConceptoId] = useState<number | ''>('');

  useEffect(() => {
    if (existingProceso) {
      setNombre(existingProceso.nombre);
      setPorcentaje(existingProceso.porcentaje);
      setCatalogoConceptoId(existingProceso.catalogoConceptoId);
    } else {
      setNombre('');
      setPorcentaje(0);
      setCatalogoConceptoId('');
    }
  }, [existingProceso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || catalogoConceptoId === '') {
      alert('El nombre y el concepto asociado son obligatorios.');
      return;
    }

    const newProceso: Omit<ProcesoConstructivo, 'id'> = {
      nombre,
      porcentaje,
      catalogoConceptoId: catalogoConceptoId as number, // Cast to number as it's validated above
    };

    if (existingProceso) {
      onSave({ ...newProceso, id: existingProceso.id });
    } else {
      onSave(newProceso);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>{existingProceso ? 'Editar Proceso Constructivo' : 'Agregar Proceso Constructivo'}</h2>
      <div className="form-group">
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="porcentaje">Porcentaje:</label>
        <input
          type="number"
          id="porcentaje"
          value={porcentaje}
          onChange={(e) => setPorcentaje(parseFloat(e.target.value))}
          required
          min="0"
          max="100"
        />
      </div>
      <div className="form-group">
        <label htmlFor="catalogoConceptoId">Concepto Asociado:</label>
        <select
          id="catalogoConceptoId"
          value={catalogoConceptoId}
          onChange={(e) => setCatalogoConceptoId(parseInt(e.target.value))}
          required
        >
          <option value="">Seleccione un concepto</option>
          {catalogoConceptos.map((concepto) => (
            <option key={concepto.id} value={concepto.id}>
              {concepto.nombre} ({concepto.disciplina})
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {existingProceso ? 'Guardar Cambios' : 'Agregar Proceso'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default ProcesoConstructivoForm;
