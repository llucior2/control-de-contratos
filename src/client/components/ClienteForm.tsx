import { useState } from 'react';

interface ClienteFormProps {
  onClienteAdded: () => void;
  razonSocialId: number | null; // New prop
}

const ClienteForm = ({ onClienteAdded, razonSocialId }: ClienteFormProps) => {
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razonSocialId) {
      alert('Debe seleccionar una Razón Social para agregar un cliente.');
      return;
    }
    const newCliente = { nombre, rfc, contactoPrincipal: { nombre: '', telefono: '', email: '' }, razonSocialId };
    
    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCliente),
    });

    if (response.ok) {
      setNombre('');
      setRfc('');
      onClienteAdded();
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message || 'No se pudo agregar el cliente.'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre / Razón Social</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>RFC</label>
        <input type="text" value={rfc} onChange={(e) => setRfc(e.target.value)} />
      </div>
      <button type="submit">Agregar Cliente</button>
    </form>
  );
};

export default ClienteForm;