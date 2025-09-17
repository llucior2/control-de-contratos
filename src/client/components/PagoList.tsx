import { Pago, Factura, Contrato, Cliente } from '../../types';
import './PagoList.css';

interface PagoListProps {
  pagos: Pago[];
  facturas: Factura[];
  contratos: Contrato[];
  clientes: Cliente[];
  onAddPago: () => void;
  onEditPago: (pago: Pago) => void;
  onDeletePago: (pagoId: number) => void;
}

const PagoList = ({ pagos, facturas, contratos, clientes, onAddPago, onEditPago, onDeletePago }: PagoListProps) => {

  const getPagoContext = (pago: Pago) => {
    const factura = facturas.find(f => f.id === pago.facturaId);
    const contrato = contratos.find(c => c.id === factura?.contratoId);
    const cliente = clientes.find(c => c.id === contrato?.clienteId);

    return {
      facturaFolio: factura?.folioFactura ?? 'N/A',
      contratoFolio: contrato?.folio ?? 'N/A',
      clienteNombre: cliente?.nombre ?? 'N/A',
    };
  };

  return (
    <div className="pago-list-container">
      <div className="list-header">
        <h2>Gestión de Pagos</h2>
        <button onClick={onAddPago} className="add-btn">Registrar Pago</button>
      </div>
      <table className="pago-table">
        <thead>
          <tr>
            <th>ID Pago</th>
            <th>Fecha de Pago</th>
            <th>Monto Pagado</th>
            <th>Método</th>
            <th>Folio Factura</th>
            <th>Folio Contrato</th>
            <th>Cliente</th>
            <th>Comentarios</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map(pago => {
            const { facturaFolio, contratoFolio, clienteNombre } = getPagoContext(pago);
            return (
              <tr key={pago.id}>
                <td>{pago.id}</td>
                <td>{pago.fechaPago}</td>
                <td>{pago.montoPagado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                <td>{pago.metodoPago}</td>
                <td>{facturaFolio}</td>
                <td>{contratoFolio}</td>
                <td>{clienteNombre}</td>
                <td>{pago.comentarios}</td>
                <td>
                  <button className="edit-btn-small" onClick={() => onEditPago(pago)}>Editar</button>
                  <button className="delete-btn-small" onClick={() => onDeletePago(pago.id)}>Eliminar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pagos.length === 0 && <p className="no-results">No hay pagos registrados.</p>}
    </div>
  );
};

export default PagoList;
