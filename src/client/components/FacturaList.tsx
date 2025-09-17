import React, { useMemo, useState, useEffect } from 'react';
import { Factura, Cliente, Contrato } from '../../types';
import './FacturaList.css';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  ColumnResizeMode,
  VisibilityState,
} from '@tanstack/react-table';
import ViewOptionsModal from './ViewOptionsModal'; // Import the modal

interface FacturaListProps {
  facturas: Factura[];
  clientes: Cliente[];
  contratos: Contrato[];
  onAddFactura: () => void;
  onEditFactura: (factura: Factura) => void;
  onDeleteFactura: (facturaId: number) => void;
}

const FacturaList: React.FC<FacturaListProps> = ({ facturas, clientes, contratos, onAddFactura, onEditFactura, onDeleteFactura }) => {
  const clienteMap = useMemo(() => new Map(clientes.map(c => [c.id, c])), [clientes]);
  const contratoMap = useMemo(() => new Map(contratos.map(c => [c.id, c])), [contratos]);

  const [columnResizeMode, ] = useState<ColumnResizeMode>('onChange');
  const [showViewOptionsModal, setShowViewOptionsModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Map TanStack Table column IDs to ViewOptionsModal's visibleFields
  const mapColumnVisibilityToModalFields = (currentColumnVisibility: VisibilityState) => {
    const fields: Record<string, boolean> = {};
    table.getAllColumns().forEach(column => {
      if (column.id !== 'acciones') { // Exclude actions column from visibility toggle
        fields[column.id] = currentColumnVisibility[column.id] !== false; // Default to true if not explicitly false
      }
    });
    return fields;
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setColumnVisibility(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const columns = useMemo<ColumnDef<Factura>[]>(
    () => [
      {
        accessorKey: 'folioFactura',
        id: 'folioFactura',
        header: 'Folio',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorFn: row => contratoMap.get(row.contratoId)?.nombreProyecto || 'N/A',
        id: 'nombreProyecto',
        header: 'Proyecto',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorFn: row => {
          const contrato = contratoMap.get(row.contratoId);
          return contrato ? clienteMap.get(contrato.clienteId)?.nombre || 'N/A' : 'N/A';
        },
        id: 'clienteNombre',
        header: 'Cliente',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'concepto',
        id: 'concepto',
        header: 'Concepto',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'importeEstimacion',
        id: 'importeEstimacion',
        header: 'Importe Est.',
        cell: info => Number(info.getValue()).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'amortizacionAnticipo',
        id: 'amortizacionAnticipo',
        header: 'Amort. Ant.',
        cell: info => Number(info.getValue()).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'fondoGarantia',
        id: 'fondoGarantia',
        header: 'Fondo G.',
        cell: info => Number(info.getValue()).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'deductivaCargos',
        id: 'deductivaCargos',
        header: 'Deductiva',
        cell: info => Number(info.getValue()).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: 'subtotal',
        header: 'Subtotal',
        cell: ({ row }) => {
          const factura = row.original;
          const importe = Number(factura.importeEstimacion) || 0;
          const amortizacion = Number(factura.amortizacionAnticipo) || 0;
          const fondo = Number(factura.fondoGarantia) || 0;
          const deductiva = Number(factura.deductivaCargos) || 0;
          const sub = importe - amortizacion - fondo - deductiva;
          return sub.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        },
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: 'iva',
        header: 'IVA',
        cell: ({ row }) => {
          const factura = row.original;
          const contrato = contratoMap.get(factura.contratoId);
          const importe = Number(factura.importeEstimacion) || 0;
          const amortizacion = Number(factura.amortizacionAnticipo) || 0;
          const fondo = Number(factura.fondoGarantia) || 0;
          const deductiva = Number(factura.deductivaCargos) || 0;
          const sub = importe - amortizacion - fondo - deductiva;
          let ivaCalc = 0;
          if (contrato?.tipoIVA === 'IVA 16%') {
            ivaCalc = sub * 0.16;
          }
          return ivaCalc.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        },
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => {
          const factura = row.original;
          const contrato = contratoMap.get(factura.contratoId);
          const importe = Number(factura.importeEstimacion) || 0;
          const amortizacion = Number(factura.amortizacionAnticipo) || 0;
          const fondo = Number(factura.fondoGarantia) || 0;
          const deductiva = Number(factura.deductivaCargos) || 0;
          const sub = importe - amortizacion - fondo - deductiva;
          let ivaCalc = 0;
          if (contrato?.tipoIVA === 'IVA 16%') {
            ivaCalc = sub * 0.16;
          }
          const tot = sub + ivaCalc;
          return tot.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        },
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'estatus',
        id: 'estatus',
        header: 'Estatus',
        cell: info => (
          <span style={{
            color: info.getValue() === 'Pagada' ? 'green' : 'red',
            fontWeight: 'bold'
          }}>{String(info.getValue())}</span>
        ),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'fechaEmision',
        id: 'fechaEmision',
        header: 'Fecha Emisión',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'comentarios',
        id: 'comentarios',
        header: 'Comentarios',
        cell: info => info.getValue(),
        
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="action-buttons-cell">
            <button className="action-button edit" onClick={() => onEditFactura(row.original)} title="Editar">✏️</button>
            <button className="action-button delete" onClick={() => onDeleteFactura(row.original.id)} title="Eliminar">🗑️</button>
          </div>
        ),
        
        enableResizing: false,
        enableHiding: false, // Actions column should always be visible
      },
    ],
    [clienteMap, contratoMap, onEditFactura, onDeleteFactura] // Dependencies for useMemo
  );

  const table = useReactTable({
    data: facturas,
    columns,
    columnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
    enableColumnResizing: true,
    autoResetAll: false,
  });

  // Initialize column visibility state based on all columns
  useEffect(() => {
    const initialVisibility: VisibilityState = {};
    table.getAllColumns().forEach(column => {
      if (column.id !== 'acciones') {
        initialVisibility[column.id] = true; // All columns visible by default except actions
      }
    });
    setColumnVisibility(initialVisibility);
  }, [table]);


  return (
    <div>
      <div className="list-header">
        <h2>Facturas</h2>
        <div className="header-controls">
          <button onClick={onAddFactura}>Nueva Factura</button>
          <button onClick={() => setShowViewOptionsModal(true)}>Configurar Vista</button> {/* Button to open modal */}
        </div>
      </div>

      <div className="table-container">
        <table >
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th {...{
                    key: header.id,
                    colSpan: header.colSpan,
                    onDoubleClick: () => header.column.resetSize(),
                  }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`resizer ${
                          header.column.getIsResizing() ? 'isResizing' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td {...{
                    key: cell.id,
                    style: {
                      width: cell.column.getSize(),
                    },
                  }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ViewOptionsModal
        isOpen={showViewOptionsModal}
        onClose={() => setShowViewOptionsModal(false)}
        visibleFields={mapColumnVisibilityToModalFields(columnVisibility)}
        onVisibilityChange={handleVisibilityChange}
      />
    </div>
  );
};

export default FacturaList;