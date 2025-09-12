import { useState } from 'react';

const ClienteForm = ({ onClienteAdded }: { onClienteAdded: () => void }) => {
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCliente = { nombre, rfc, contactoPrincipal: { nombre: '', telefono: '', email: '' } };
    
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCliente),
    });

    setNombre('');
    setRfc('');
    onClienteAdded();
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
