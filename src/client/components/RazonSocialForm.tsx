import React, { useState, useEffect } from 'react';
import { RazonSocial } from '../../types';

interface RazonSocialFormProps {
  onSave: (rs: Omit<RazonSocial, 'id'> | RazonSocial) => void;
  onCancel: () => void;
  existingRazonSocial: RazonSocial | null;
}

const RazonSocialForm: React.FC<RazonSocialFormProps> = ({ onSave, onCancel, existingRazonSocial }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
  });

  useEffect(() => {
    if (existingRazonSocial) {
      setFormData({
        nombre: existingRazonSocial.nombre,
        rfc: existingRazonSocial.rfc,
      });
    }
  }, [existingRazonSocial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingRazonSocial) {
      onSave({ ...existingRazonSocial, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <h3 style={{ gridColumn: '1 / -1' }}>{existingRazonSocial ? 'Editar' : 'Nueva'} Razón Social</h3>
      <div>
        <label>Nombre</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
      </div>
      <div>
        <label>RFC</label>
        <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} required />
      </div>
      <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  );
};

export default RazonSocialForm;
