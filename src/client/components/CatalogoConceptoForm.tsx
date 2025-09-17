import { useState, useEffect } from 'react';
import { CatalogoConcepto } from '../../types';

interface CatalogoConceptoFormProps {
  onSave: (data: Omit<CatalogoConcepto, 'id'> | CatalogoConcepto) => void;
  onCancel: () => void;
  existingConcepto?: CatalogoConcepto | null;
}

const CatalogoConceptoForm = ({ onSave, onCancel, existingConcepto }: CatalogoConceptoFormProps) => {
  const [nombre, setNombre] = useState('');
  const [disciplina, setDisciplina] = useState('');

  useEffect(() => {
    if (existingConcepto) {
      setNombre(existingConcepto.nombre);
      setDisciplina(existingConcepto.disciplina);
    } else {
      setNombre('');
      setDisciplina('');
    }
  }, [existingConcepto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !disciplina) {
      alert('El nombre y la disciplina son obligatorios.');
      return;
    }

    const data = { nombre, disciplina };

    if (existingConcepto) {
      onSave({ ...existingConcepto, ...data });
    } else {
      onSave(data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{existingConcepto ? 'Editar' : 'Nuevo'} Concepto de Catálogo</h3>
      <div className="form-group">
        <label>Nombre del Concepto</label>
        <input 
          type="text" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          placeholder="Ej. Muro de Tablaroca" 
          required 
        />
      </div>
      <div className="form-group">
        <label>Disciplina</label>
        <input 
          type="text" 
          value={disciplina} 
          onChange={(e) => setDisciplina(e.target.value)} 
          placeholder="Ej. Acabados, Estructura, Instalaciones..." 
          required 
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="add-btn">Guardar</button>
        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
      </div>
    </form>
  );
};

export default CatalogoConceptoForm;
