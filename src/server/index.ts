import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import xlsx from 'xlsx';
import { Database, Cliente, Contrato, Factura, Pago, RazonSocial, OrdenDeCambio, CatalogoConcepto, ProcesoConstructivo } from '../types.js';
import { generateExcel, ReportData } from '@obras-modular/reporters';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// --- Static Files ---
const updatesPath = path.join(__dirname, '..', '..', 'updates');
app.use('/updates', express.static(updatesPath));
const staticPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(staticPath));

// --- DB Setup ---
const userDataPath = process.argv[2] || null;
const dbPath = userDataPath ? path.join(userDataPath, 'db.json') : path.join(__dirname, '..', '..', 'data', 'db.json');

const readDb = async (): Promise<Database> => {
  const defaultDb: Database = { 
    razonesSociales: [], 
    clientes: [], 
    contratos: [], 
    ordenesDeCambio: [], 
    facturas: [], 
    pagos: [],
    catalogoConceptos: [],
    procesosConstructivos: []
  };
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const existingDb = JSON.parse(data);
    return { ...defaultDb, ...existingDb };
  } catch (error) {
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
};

const writeDb = async (db: Database) => {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
};

// --- Helper Functions ---
const updateInvoiceStatus = (factura: Factura, allPagos: Pago[]) => {
    const relevantPagos = allPagos.filter(p => p.facturaId === factura.id);
    const totalPagado = relevantPagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    
    // Calculate the net amount of the invoice
    const montoNetoFactura = (factura.importeEstimacion || 0) - 
                             (factura.amortizacionAnticipo || 0) - 
                             (factura.fondoGarantia || 0) - 
                             (factura.deductivaCargos || 0);

    if (totalPagado <= 0) {
        factura.estatus = 'Pendiente';
    } else if (totalPagado < montoNetoFactura) {
        factura.estatus = 'Pagada Parcialmente';
    } else {
        factura.estatus = 'Pagada';
    }
};

const updateAllInvoiceStatuses = (db: Database) => {
    if(db.facturas && db.pagos){
        db.facturas.forEach(factura => updateInvoiceStatus(factura, db.pagos));
    }
};

const parseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
};

const getContratoStatus = (fechaInicioStr: string, fechaTerminoStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDateString = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts.map(p => parseInt(p, 10));
            return new Date(year, month - 1, day);
        }
        return null;
    };

    const fechaInicio = parseDateString(fechaInicioStr);
    const fechaTermino = parseDateString(fechaTerminoStr);

    if (!fechaInicio || !fechaTermino) {
        return 'Desconocido'; // Or handle as an error
    }

    if (fechaInicio > today) {
        return 'Pendiente';
    } else if (fechaTermino < today) {
        return 'Vencido';
    } else {
        return 'Vigente';
    }
};

// --- Razones Sociales Endpoints ---
app.get('/api/razonesSociales', async (req, res) => {
  const db = await readDb();
  res.json(db.razonesSociales);
});

app.post('/api/razonesSociales', async (req, res) => {
  const db = await readDb();
  const newRazonSocial: RazonSocial = {
    id: db.razonesSociales.length > 0 ? Math.max(...db.razonesSociales.map(rs => rs.id)) + 1 : 1,
    ...req.body,
  };
  db.razonesSociales.push(newRazonSocial);
  await writeDb(db);
  res.status(201).json(newRazonSocial);
});

app.put('/api/razonesSociales/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.razonesSociales.findIndex(rs => rs.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Razón Social no encontrada' });
  }
  db.razonesSociales[index] = { ...db.razonesSociales[index], ...req.body };
  await writeDb(db);
  res.json(db.razonesSociales[index]);
});

app.delete('/api/razonesSociales/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  db.razonesSociales = db.razonesSociales.filter(rs => rs.id !== id);
  await writeDb(db);
  res.status(204).send();
});

// --- Clientes Endpoints ---
app.get('/api/clientes', async (req, res) => {
  const db = await readDb();
  res.json(db.clientes);
});

app.post('/api/clientes', async (req, res) => {
  const db = await readDb();
  const { nombre, razonSocialId } = req.body;

  // Basic validation
  if (!nombre || !razonSocialId) {
    return res.status(400).json({ message: 'El nombre del cliente y la Razón Social son obligatorios.' });
  }

  const existingClient = db.clientes.find(
    c => c.nombre.toLowerCase() === nombre.toLowerCase() && c.razonSocialId === Number(razonSocialId)
  );

  if (existingClient) {
    return res.status(409).json({ message: 'Este cliente ya existe para la Razón Social seleccionada.' });
  }

  const newCliente: Cliente = {
    id: db.clientes.length > 0 ? Math.max(...db.clientes.map(c => c.id)) + 1 : 1,
    ...req.body,
  };
  db.clientes.push(newCliente);
  await writeDb(db);
  res.status(201).json(newCliente);
});

app.delete('/api/clientes/:id', async (req, res) => {
  const db = await readDb();
  const clienteId = parseInt(req.params.id, 10);
  db.clientes = db.clientes.filter(c => c.id !== clienteId);
  await writeDb(db);
  res.status(204).send();
});

app.get('/api/razones-sociales-por-cliente', async (req, res) => {
    const db = await readDb();
    const nombreCliente = req.query.nombreCliente as string;

    if (!nombreCliente) {
        return res.status(400).json({ message: 'El nombre del cliente es obligatorio.' });
    }

    // Find all client entries with that name
    const clientsByName = db.clientes.filter(c => c.nombre.toLowerCase() === nombreCliente.toLowerCase());
    
    // Get the unique razonSocialIds from those clients
    const razonSocialIds = [...new Set(clientsByName.map(c => c.razonSocialId))];

    // Get the full RazonSocial objects
    const razonesSociales = db.razonesSociales.filter(rs => razonSocialIds.includes(rs.id));

    res.json(razonesSociales);
});

// --- Contratos Endpoints ---
app.get('/api/contratos', async (req, res) => {
  const db = await readDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updatedContratos = db.contratos.map((contrato: Contrato) => {
    if (contrato.fechaTermino && contrato.estatus !== 'Cancelado') {
      try {
        const parts = contrato.fechaTermino.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(p => parseInt(p, 10));
          const fechaTermino = new Date(year, month - 1, day);
          if (today > fechaTermino) {
            return { ...contrato, estatus: 'Vencido' };
          }
        }
      } catch (e) {
        console.error(`Error parsing date for contract ID ${contrato.id}:`, e);
      }
    }
    return contrato;
  });
  res.json(updatedContratos);
});

app.post('/api/contratos', async (req, res) => {
  const db = await readDb();
  const newContrato: Contrato = {
    id: db.contratos.length > 0 ? Math.max(...db.contratos.map(c => c.id)) + 1 : 1,
    ...req.body,
  };
  db.contratos.push(newContrato);
  await writeDb(db);
  res.status(201).json(newContrato);
});

app.put('/api/contratos/:id', async (req, res) => {
  const db = await readDb();
  const contratoId = parseInt(req.params.id, 10);
  const contratoIndex = db.contratos.findIndex(c => c.id === contratoId);
  if (contratoIndex === -1) {
    return res.status(404).json({ message: 'Contrato no encontrado' });
  }
  db.contratos[contratoIndex] = { ...db.contratos[contratoIndex], ...req.body };
  await writeDb(db);
  res.json(db.contratos[contratoIndex]);
});

app.delete('/api/contratos/:id', async (req, res) => {
  const db = await readDb();
  const contratoId = parseInt(req.params.id, 10);
  db.contratos = db.contratos.filter(c => c.id !== contratoId);
  await writeDb(db);
  res.status(204).send();
});

// --- Ordenes de Cambio Endpoints ---
app.get('/api/ordenesDeCambio', async (req, res) => {
  const db = await readDb();
  res.json(db.ordenesDeCambio);
});

app.post('/api/ordenesDeCambio', async (req, res) => {
  const db = await readDb();
  const newOrden: OrdenDeCambio = {
    id: db.ordenesDeCambio.length > 0 ? Math.max(...db.ordenesDeCambio.map(o => o.id)) + 1 : 1,
    ...req.body,
  };
  db.ordenesDeCambio.push(newOrden);
  await writeDb(db);
  res.status(201).json(newOrden);
});

app.put('/api/ordenesDeCambio/:id', async (req, res) => {
  const db = await readDb();
  const ordenId = parseInt(req.params.id, 10);
  const ordenIndex = db.ordenesDeCambio.findIndex(o => o.id === ordenId);
  if (ordenIndex === -1) {
    return res.status(404).json({ message: 'Orden de Cambio no encontrada' });
  }
  db.ordenesDeCambio[ordenIndex] = { ...db.ordenesDeCambio[ordenIndex], ...req.body };
  await writeDb(db);
  res.json(db.ordenesDeCambio[ordenIndex]);
});

app.delete('/api/ordenesDeCambio/:id', async (req, res) => {
  const db = await readDb();
  const ordenId = parseInt(req.params.id, 10);
  db.ordenesDeCambio = db.ordenesDeCambio.filter(o => o.id !== ordenId);
  await writeDb(db);
  res.status(204).send();
});

// --- Facturas Endpoints ---
app.get('/api/facturas', async (req, res) => {
  const db = await readDb();
  res.json(db.facturas);
});

app.post('/api/facturas', async (req, res) => {
  const db = await readDb();
  const newFactura: Omit<Factura, 'id'> = req.body;
  const newFacturaWithId: Factura = {
    id: db.facturas.length > 0 ? Math.max(...db.facturas.map(f => f.id)) + 1 : 1,
    ...newFactura,
  };
  db.facturas.push(newFacturaWithId);
  await writeDb(db);
  res.status(201).json(newFacturaWithId);
});

app.put('/api/facturas/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.facturas.findIndex(f => f.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Factura no encontrada' });
  }
  db.facturas[index] = { ...db.facturas[index], ...req.body };
  await writeDb(db);
  res.json(db.facturas[index]);
});

app.delete('/api/facturas/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  db.facturas = db.facturas.filter(f => f.id !== id);
  await writeDb(db);
  res.status(204).send();
});

// --- Pagos Endpoints ---
app.get('/api/pagos', async (req, res) => {
  const db = await readDb();
  res.json(db.pagos);
});

app.post('/api/pagos', async (req, res) => {
  const db = await readDb();
  const newPago: Omit<Pago, 'id'> = req.body;
  const newPagoWithId: Pago = {
    id: db.pagos.length > 0 ? Math.max(...db.pagos.map(p => p.id)) + 1 : 1,
    ...newPago,
  };
  db.pagos.push(newPagoWithId);
  updateAllInvoiceStatuses(db); // Update status after adding payment
  await writeDb(db);
  res.status(201).json(newPagoWithId);
});

app.put('/api/pagos/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.pagos.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Pago no encontrado' });
  }
  db.pagos[index] = { ...db.pagos[index], ...req.body };
  updateAllInvoiceStatuses(db); // Update status after modifying payment
  await writeDb(db);
  res.json(db.pagos[index]);
});

app.delete('/api/pagos/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  db.pagos = db.pagos.filter(p => p.id !== id);
  updateAllInvoiceStatuses(db); // Update status after deleting payment
  await writeDb(db);
  res.status(204).send();
});

// --- Catalogo Conceptos Endpoints ---
app.get('/api/catalogoConceptos', async (req, res) => {
  const db = await readDb();
  res.json(db.catalogoConceptos);
});

app.post('/api/catalogoConceptos', async (req, res) => {
  const db = await readDb();
  const newConcepto: CatalogoConcepto = {
    id: db.catalogoConceptos.length > 0 ? Math.max(...db.catalogoConceptos.map(c => c.id)) + 1 : 1,
    ...req.body,
  };
  db.catalogoConceptos.push(newConcepto);
  await writeDb(db);
  res.status(201).json(newConcepto);
});

app.put('/api/catalogoConceptos/:id', async (req, res) => {
  const db = await readDb();
  const conceptoId = parseInt(req.params.id, 10);
  const conceptoIndex = db.catalogoConceptos.findIndex(c => c.id === conceptoId);
  if (conceptoIndex === -1) {
    return res.status(404).json({ message: 'Concepto de Catálogo no encontrado' });
  }
  db.catalogoConceptos[conceptoIndex] = { ...db.catalogoConceptos[conceptoIndex], ...req.body };
  await writeDb(db);
  res.json(db.catalogoConceptos[conceptoIndex]);
});

app.delete('/api/catalogoConceptos/:id', async (req, res) => {
  const db = await readDb();
  const conceptoId = parseInt(req.params.id, 10);
  db.catalogoConceptos = db.catalogoConceptos.filter(c => c.id !== conceptoId);
  // Also delete associated procesos
  db.procesosConstructivos = db.procesosConstructivos.filter(p => p.catalogoConceptoId !== conceptoId);
  await writeDb(db);
  res.status(204).send();
});

// --- Procesos Constructivos Endpoints ---
app.get('/api/procesosConstructivos', async (req, res) => {
  const db = await readDb();
  res.json(db.procesosConstructivos);
});

app.post('/api/procesosConstructivos', async (req, res) => {
  const db = await readDb();
  const newProceso: ProcesoConstructivo = {
    id: db.procesosConstructivos.length > 0 ? Math.max(...db.procesosConstructivos.map(p => p.id)) + 1 : 1,
    ...req.body,
  };
  db.procesosConstructivos.push(newProceso);
  await writeDb(db);
  res.status(201).json(newProceso);
});

app.put('/api/procesosConstructivos/:id', async (req, res) => {
  const db = await readDb();
  const procesoId = parseInt(req.params.id, 10);
  const procesoIndex = db.procesosConstructivos.findIndex(p => p.id === procesoId);
  if (procesoIndex === -1) {
    return res.status(404).json({ message: 'Proceso Constructivo no encontrado' });
  }
  db.procesosConstructivos[procesoIndex] = { ...db.procesosConstructivos[procesoIndex], ...req.body };
  await writeDb(db);
  res.json(db.procesosConstructivos[procesoIndex]);
});

app.delete('/api/procesosConstructivos/:id', async (req, res) => {
  const db = await readDb();
  const procesoId = parseInt(req.params.id, 10);
  db.procesosConstructivos = db.procesosConstructivos.filter(p => p.id !== procesoId);
  await writeDb(db);
  res.status(204).send();
});

// --- Bulk Upload Endpoints ---
app.post('/api/bulk/clientes', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const { razonSocialId } = req.body;

    if (!razonSocialId) {
        return res.status(400).json({ message: 'Debe seleccionar una Razón Social.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const nuevosClientes = data;
    // Check for duplicates within the same razonSocialId
    const existingClients = new Set(
        db.clientes
            .filter(c => c.razonSocialId === Number(razonSocialId))
            .map(c => c.nombre.toLowerCase())
    );

    let nextId = db.clientes.length > 0 ? Math.max(...db.clientes.map(c => c.id)) + 1 : 1;
    
    const summary = {
        added: 0,
        errors: [] as { row: number, data: any, error: string }[],
    };

    for (const [index, cliente] of nuevosClientes.entries()) {
        try {
            if (!cliente.nombre || typeof cliente.nombre !== 'string' || cliente.nombre.trim() === '') {
                summary.errors.push({ row: index + 2, data: cliente, error: 'El nombre del cliente no puede estar vacío.' });
                continue;
            }

            const clientNameLower = cliente.nombre.toLowerCase();

            if (existingClients.has(clientNameLower)) {
                summary.errors.push({ row: index + 2, data: cliente, error: 'Ya existe un cliente con este nombre en la razón social seleccionada.' });
            } else {
                const nuevoCliente: Cliente = {
                    id: nextId++,
                    razonSocialId: Number(razonSocialId),
                    nombre: cliente.nombre,
                    rfc: cliente.rfc,
                    direccion: cliente.direccion,
                    contactoPrincipal: {
                        nombre: cliente.contacto_nombre || '',
                        telefono: cliente.contacto_telefono || '',
                        email: cliente.contacto_email || '',
                    }
                };
                db.clientes.push(nuevoCliente);
                existingClients.add(clientNameLower); // Add to set to catch duplicates within the same upload file
                summary.added++;
            }
        } catch (e) {
            summary.errors.push({ row: index + 2, data: cliente, error: 'Error inesperado al procesar este cliente.' });
        }
    }

    await writeDb(db);

    const message = `Carga finalizada. Clientes agregados: ${summary.added}. Errores: ${summary.errors.length}.`;
    res.status(201).json({
        message,
        addedCount: summary.added,
        errors: summary.errors
    });
});

app.post('/api/bulk/contratos', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const { razonSocialId } = req.body;
    if (!razonSocialId) {
        return res.status(400).json({ message: 'Debe seleccionar una Razón Social.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const nuevosContratos = data;
    const existingFolios = new Set(db.contratos.map(c => c.folio));
    const clientNameToIdMap = new Map(db.clientes.map(c => [c.nombre.toLowerCase(), c.id]));
    let nextId = db.contratos.length > 0 ? Math.max(...db.contratos.map(c => c.id)) + 1 : 1;
    const summary = { added: 0, skippedFolio: 0, skippedClient: 0, skippedFolioNames: [] as string[], skippedClientNames: [] as string[], errors: [] as any[] };

    for (const [index, contrato] of nuevosContratos.entries()) {
        if (existingFolios.has(contrato.folio)) {
            summary.errors.push({ row: index + 2, data: contrato, error: `Folio de contrato '${contrato.folio}' ya existe.` });
            summary.skippedFolio++;
            summary.skippedFolioNames.push(contrato.folio);
            continue;
        }
        const clienteId = clientNameToIdMap.get(contrato.clienteNombre?.toLowerCase());
        if (!clienteId) {
            summary.errors.push({ row: index + 2, data: contrato, error: `Cliente '${contrato.clienteNombre}' no encontrado para la Razón Social seleccionada.` });
            summary.skippedClient++;
            summary.skippedClientNames.push(contrato.nombreProyecto);
            continue;
        }
        const parsedFechaInicio = parseDate(contrato.fechaInicio);
        const parsedFechaTermino = parseDate(contrato.fechaTermino);
        const estatusCalculado = getContratoStatus(parsedFechaInicio, parsedFechaTermino);

        const nuevoContrato = {
            ...contrato,
            id: nextId++,
            clienteId,
            razonSocialId: Number(razonSocialId),
            fechaInicio: parsedFechaInicio,
            fechaTermino: parsedFechaTermino,
            estatus: estatusCalculado,
        };
        delete nuevoContrato.clienteNombre;
        db.contratos.push(nuevoContrato);
        existingFolios.add(contrato.folio);
        summary.added++;
    }
    await writeDb(db);
    res.status(201).json({ 
        message: `Contratos: ${summary.added} agregados. Errores: ${summary.errors.length}.`,
        ...summary 
    });
});

app.post('/api/bulk/facturas', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let nextId = db.facturas.length > 0 ? Math.max(...db.facturas.map(f => f.id)) + 1 : 1;
    const contratoFolioToIdMap = new Map(db.contratos.map(c => [c.folio, c.id]));
    const summary = { added: 0, errors: [] as any[] };

    for (const [index, factura] of data.entries()) {
        const typedFactura = factura as any;
        const contratoId = contratoFolioToIdMap.get(typedFactura.contratoFolio);
        if (!contratoId) {
            summary.errors.push({ row: index + 2, data: factura, error: `Contrato con folio '${typedFactura.contratoFolio}' no encontrado.` });
            continue;
        }
        const nuevaFactura: Factura = {
            id: nextId++,
            contratoId,
            folioFactura: typedFactura.folioFactura,
            fechaEmision: parseDate(typedFactura.fechaEmision),
            concepto: typedFactura.concepto,
            importeEstimacion: Number(typedFactura.importeEstimacion) || 0,
            amortizacionAnticipo: Number(typedFactura.amortizacionAnticipo) || 0,
            fondoGarantia: Number(typedFactura.fondoGarantia) || 0,
            deductivaCargos: Number(typedFactura.deductivaCargos) || 0,
            estatus: 'Pendiente',
            comentarios: typedFactura.comentarios || '',
        };
        db.facturas.push(nuevaFactura);
        summary.added++;
    }
    await writeDb(db);
    res.status(201).json({ 
        message: `Carga de facturas finalizada. Agregadas: ${summary.added}. Errores: ${summary.errors.length}.`,
        ...summary 
    });
});

app.post('/api/bulk-upload/pagos', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const summary = { added: 0, errors: [] as any[] };
    let nextId = db.pagos.length > 0 ? Math.max(...db.pagos.map(p => p.id)) + 1 : 1;

    for (const [index, row] of data.entries()) {
        const typedRow = row as any;
        const factura = db.facturas.find(f => f.folioFactura === typedRow.facturaFolio);

        if (!factura) {
            summary.errors.push({ row: index + 2, data: row, error: `No se encontró la factura con el folio '${typedRow.facturaFolio}'.` });
            continue;
        }

        const newPago: Pago = {
            id: nextId++,
            facturaId: factura.id,
            fecha: typedRow.fecha ? new Date(typedRow.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            monto: Number(typedRow.monto) || 0,
            metodoDePago: typedRow.metodoDePago || 'Transferencia',
            referencia: typedRow.comentario || ''
        };

        db.pagos.push(newPago);
        summary.added++;
    }

    updateAllInvoiceStatuses(db);
    await writeDb(db);

    res.status(201).json({ 
        message: `Carga de pagos finalizada. Agregados: ${summary.added}. Errores: ${summary.errors.length}.`,
        ...summary 
    });
});

app.post('/api/bulk-upload/catalogo-conceptos', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const summary = { added: 0, errors: [] as any[] };
    let nextId = db.catalogoConceptos.length > 0 ? Math.max(...db.catalogoConceptos.map(c => c.id)) + 1 : 1;
    const existingClaves = new Set(db.catalogoConceptos.map(c => c.clave));

    for (const [index, row] of data.entries()) {
        const typedRow = row as any;
        if (existingClaves.has(typedRow.clave)) {
            summary.errors.push({ row: index + 2, data: row, error: `La clave de concepto '${typedRow.clave}' ya existe.` });
            continue;
        }

        const newConcepto: CatalogoConcepto = {
            id: nextId++,
            clave: typedRow.clave,
            nombre: typedRow.nombre,
            unidad: typedRow.unidad,
            precioUnitario: Number(typedRow.precioUnitario) || 0
        };

        db.catalogoConceptos.push(newConcepto);
        existingClaves.add(newConcepto.clave);
        summary.added++;
    }

    await writeDb(db);
    res.status(201).json({ 
        message: `Carga de conceptos finalizada. Agregados: ${summary.added}. Errores: ${summary.errors.length}.`,
        ...summary 
    });
});

app.post('/api/bulk-upload/procesos-constructivos', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const db = await readDb();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const summary = { added: 0, errors: [] as any[] };
    let nextId = db.procesosConstructivos.length > 0 ? Math.max(...db.procesosConstructivos.map(p => p.id)) + 1 : 1;
    const conceptoClaveToIdMap = new Map(db.catalogoConceptos.map(c => [c.clave, c.id]));

    for (const [index, row] of data.entries()) {
        const typedRow = row as any;
        const conceptoId = conceptoClaveToIdMap.get(typedRow.catalogoConceptoClave);

        if (!conceptoId) {
            summary.errors.push({ row: index + 2, data: row, error: `No se encontró el concepto con la clave '${typedRow.catalogoConceptoClave}'.` });
            continue;
        }

        const newProceso: ProcesoConstructivo = {
            id: nextId++,
            catalogoConceptoId: conceptoId,
            nombre: typedRow.nombre,
            descripcion: typedRow.descripcion,
            porcentaje: Number(typedRow.porcentaje) || 0
        };

        db.procesosConstructivos.push(newProceso);
        summary.added++;
    }

    await writeDb(db);
    res.status(201).json({ 
        message: `Carga de procesos finalizada. Agregados: ${summary.added}. Errores: ${summary.errors.length}.`,
        ...summary 
    });
});

// --- Reportes ---
app.post('/api/reporte/excel', async (req, res) => {
  const { title, columns, rows } = req.body as ReportData;
  if (!title || !columns || !rows) {
    return res.status(400).send('Datos para el reporte incompletos.');
  }
  try {
    const buffer = await generateExcel({ title, columns, rows });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar el reporte Excel:', error);
    res.status(500).send('Error interno al generar el reporte.');
  }
});

// --- Static serving and App start ---
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});