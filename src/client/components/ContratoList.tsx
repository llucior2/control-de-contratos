import { Contrato, Cliente } from '../../types';

interface ContratoListProps {
  contratos: Contrato[];
  clientes: Cliente[];
  onEdit: (contrato: Contrato) => void;
  onDelete: (contratoId: number) => void;
  visibleFields: Record<string, boolean>;
  onToggleViewOptions: () => void;
  onToggleReportModal: () => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContratoList = ({ contratos, clientes, onEdit, onDelete, visibleFields, onToggleViewOptions, onToggleReportModal, searchTerm, onSearchChange }: ContratoListProps) => {

  const groupedByClient = contratos.reduce((acc, contrato) => {
    const clientName = clientes.find(c => c.id === contrato.clienteId)?.nombre || 'Cliente Desconocido';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(contrato);
    return acc;
  }, {} as Record<string, Contrato[]>);

  return (
    <div>
      <div className="list-header">
        <h2>Contratos Vigentes</h2>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Buscar por cliente, proyecto, folio..."
            value={searchTerm}
            onChange={onSearchChange}
            className="search-input"
          />
          <button onClick={onToggleViewOptions} className="view-options-btn">Configurar Vista</button>
          <button onClick={onToggleReportModal} className="report-btn">Generar Reporte</button>
        </div>
      </div>

      {Object.entries(groupedByClient).map(([clientName, clientContratos]) => (
        <div key={clientName}>
          <h3 className="client-group-header">
            {clientName}
          </h3>
          <div className="card-container">
            {clientContratos.map(contrato => (
              <div key={contrato.id} className="card">
                <button onClick={() => onEdit(contrato)} className="edit-btn">Editar</button>
                <button onClick={() => onDelete(contrato.id)} className="delete-btn">Eliminar</button>
                <h4>{contrato.nombreProyecto}</h4>
                {visibleFields.folio && <p><strong>Folio:</strong> {contrato.folio}</p>}
                {visibleFields.monto && <p><strong>Monto (antes de IVA):</strong> {contrato.moneda === 'USD' ? '$' : '$'}{contrato.monto.toLocaleString()} {contrato.moneda}</p>}
                {visibleFields.montoTotalConIVA && contrato.tipoIVA === 'IVA 16%' && 
                  <p><strong>Monto Total (IVA Incluido):</strong> {contrato.moneda === 'USD' ? '$' : '$'}{(contrato.monto * 1.16).toLocaleString()} {contrato.moneda}</p>}
                {visibleFields.estatus && <p><strong>Estatus:</strong> <span style={{ 
                  color: contrato.estatus === 'Vigente' ? 'green' : contrato.estatus === 'Vencido' ? 'red' : 'gray',
                  fontWeight: 'bold'
                }}>{contrato.estatus}</span></p>}
                {visibleFields.fechas && <p><strong>Fechas:</strong> {contrato.fechaInicio} al {contrato.fechaTermino}</p>}
                {visibleFields.objeto && <p><strong>Alcance Contratado:</strong> {contrato.objeto}</p>}
                {visibleFields.moneda && <p><strong>Moneda:</strong> {contrato.moneda}</p>}
                {visibleFields.tipoDeCambio && contrato.moneda === 'USD' && <p><strong>T.C.:</strong> {contrato.tipoDeCambio}</p>}
                {visibleFields.tipoContrato && <p><strong>Tipo:</strong> {contrato.tipoContrato}</p>}
                {visibleFields.tipoIVA && <p><strong>IVA:</strong> {contrato.tipoIVA}</p>}
                {visibleFields.anticipoPorcentaje && <p><strong>% Anticipo:</strong> {contrato.anticipoPorcentaje}%</p>}
                {visibleFields.fondoGarantiaPorcentaje && <p><strong>% F. Garantía:</strong> {contrato.fondoGarantiaPorcentaje}%</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContratoList;