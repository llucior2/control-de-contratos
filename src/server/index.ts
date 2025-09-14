import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Database, Cliente, Contrato, Factura, Pago, RazonSocial } from '../types.js';
import { generateExcel, ReportData } from '@obras-modular/reporters';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const staticPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(staticPath));

const userDataPath = process.argv[2] || null;
const dbPath = userDataPath ? path.join(userDataPath, 'db.json') : path.join(__dirname, '..', '..', 'data', 'db.json');

const readDb = async (): Promise<Database> => {
  const defaultDb: Database = { razonesSociales: [], clientes: [], contratos: [], ordenesDeCambio: [], facturas: [], pagos: [] };
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
  await writeDb(db);
  res.json(db.pagos[index]);
});

app.delete('/api/pagos/:id', async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id, 10);
  db.pagos = db.pagos.filter(p => p.id !== id);
  await writeDb(db);
  res.status(204).send();
});

// --- Bulk Upload Endpoints ---
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

app.post('/api/bulk/clientes', async (req, res) => {
    const db = await readDb();
    const { data, razonSocialId } = req.body;
    if (!razonSocialId) {
        return res.status(400).json({ message: 'Debe seleccionar una Razón Social.' });
    }
    const nuevosClientes = data;
    const existingClientNames = new Set(db.clientes.map(c => c.nombre.toLowerCase()));
    let nextId = db.clientes.length > 0 ? Math.max(...db.clientes.map(c => c.id)) + 1 : 1;
    const summary = { added: 0, skipped: 0, skippedNames: [] as string[] };

    for (const cliente of nuevosClientes) {
        if (existingClientNames.has(cliente.nombre.toLowerCase())) {
            summary.skipped++;
            summary.skippedNames.push(cliente.nombre);
        } else {
            db.clientes.push({ ...cliente, id: nextId++, razonSocialId: Number(razonSocialId) });
            existingClientNames.add(cliente.nombre.toLowerCase());
            summary.added++;
        }
    }
    await writeDb(db);
    res.status(201).json({ message: `Clientes: ${summary.added} agregados, ${summary.skipped} omitidos. Omitidos: ${summary.skippedNames.join(', ')}` });
});

app.post('/api/bulk/contratos', async (req, res) => {
    const db = await readDb();
    const { data, razonSocialId } = req.body;
    if (!razonSocialId) {
        return res.status(400).json({ message: 'Debe seleccionar una Razón Social.' });
    }
    const nuevosContratos = data;
    const existingFolios = new Set(db.contratos.map(c => c.folio));
    const clientNameToIdMap = new Map(db.clientes.map(c => [c.nombre.toLowerCase(), c.id]));
    let nextId = db.contratos.length > 0 ? Math.max(...db.contratos.map(c => c.id)) + 1 : 1;
    const summary = { added: 0, skippedFolio: 0, skippedClient: 0, skippedFolioNames: [] as string[], skippedClientNames: [] as string[] };

    for (const contrato of nuevosContratos) {
        if (existingFolios.has(contrato.folio)) {
            summary.skippedFolio++;
            summary.skippedFolioNames.push(contrato.folio);
            continue;
        }
        const clienteId = clientNameToIdMap.get(contrato.clienteNombre?.toLowerCase());
        if (!clienteId) {
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
    res.status(201).json({ message: `Contratos: ${summary.added} agregados. Omitidos por folio duplicado: ${summary.skippedFolio}. Omitidos por cliente no encontrado: ${summary.skippedClient}.` });
});

app.post('/api/bulk/facturas', async (req, res) => {
    const db = await readDb();
    const nuevasFacturas = req.body;
    const contratoFolioToIdMap = new Map(db.contratos.map(c => [c.folio, c.id]));
    let nextId = db.facturas.length > 0 ? Math.max(...db.facturas.map(f => f.id)) + 1 : 1;
    const summary = { added: 0, skippedContrato: 0, skippedContratoFolios: [] as string[] };

    for (const factura of nuevasFacturas) {
        const contratoId = contratoFolioToIdMap.get(factura.contratoFolio);
        if (!contratoId) {
            summary.skippedContrato++;
            summary.skippedContratoFolios.push(factura.contratoFolio);
            continue;
        }
        const nuevaFactura: Factura = {
            id: nextId++,
            contratoId,
            folioFactura: factura.folioFactura,
            fechaEmision: parseDate(factura.fechaEmision),
            concepto: factura.concepto,
            importeEstimacion: Number(factura.importeEstimacion) || 0,
            amortizacionAnticipo: Number(factura.amortizacionAnticipo) || 0,
            fondoGarantia: Number(factura.fondoGarantia) || 0,
            deductivaCargos: Number(factura.deductivaCargos) || 0,
            estatus: 'Pendiente',
            comentarios: factura.comentarios || '',
        };
        db.facturas.push(nuevaFactura);
        summary.added++;
    }
    await writeDb(db);
    res.status(201).json({ message: `Facturas: ${summary.added} agregadas. Omitidas por folio de contrato no encontrado: ${summary.skippedContrato}.` });
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
