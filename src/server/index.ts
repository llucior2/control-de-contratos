import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Database, Cliente, Contrato } from '../types.js';
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
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    const defaultDb: Database = { clientes: [], contratos: [], ordenesDeCambio: [] };
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
};

const writeDb = async (db: Database) => {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
};

app.get('/api/clientes', async (req, res) => {
  const db = await readDb();
  res.json(db.clientes);
});

app.post('/api/clientes', async (req, res) => {
  const db = await readDb();
  const newCliente: Cliente = {
    id: db.clientes.length > 0 ? Math.max(...db.clientes.map((c: Cliente) => c.id)) + 1 : 1,
    ...req.body,
  };
  db.clientes.push(newCliente);
  await writeDb(db);
  res.status(201).json(newCliente);
});

app.get('/api/contratos', async (req, res) => {
  const db = await readDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updatedContratos = db.contratos.map((contrato: Contrato) => {
    if (contrato.fechaTermino && contrato.estatus !== 'Cancelado') {
      try {
        const parts = contrato.fechaTermino.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const fechaTermino = new Date(year, month, day);

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
    id: db.contratos.length > 0 ? Math.max(...db.contratos.map((c: Contrato) => c.id)) + 1 : 1,
    ...req.body,
  };
  db.contratos.push(newContrato);
  await writeDb(db);
  res.status(201).json(newContrato);
});

app.put('/api/contratos/:id', async (req, res) => {
  const db = await readDb();
  const contratoId = parseInt(req.params.id, 10);
  const contratoIndex = db.contratos.findIndex((c: Contrato) => c.id === contratoId);

  if (contratoIndex === -1) {
    return res.status(404).json({ message: 'Contrato no encontrado' });
  }

  const updatedContrato = { ...db.contratos[contratoIndex], ...req.body };
  db.contratos[contratoIndex] = updatedContrato;
  await writeDb(db);

  res.json(updatedContrato);
});

app.delete('/api/clientes/:id', async (req, res) => {
  const db = await readDb();
  const clienteId = parseInt(req.params.id, 10);
  const clienteIndex = db.clientes.findIndex((c: Cliente) => c.id === clienteId);

  if (clienteIndex === -1) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  db.clientes.splice(clienteIndex, 1);
  await writeDb(db);

  res.status(204).send();
});

app.delete('/api/contratos/:id', async (req, res) => {
  const db = await readDb();
  const contratoId = parseInt(req.params.id, 10);
  const contratoIndex = db.contratos.findIndex((c: Contrato) => c.id === contratoId);

  if (contratoIndex === -1) {
    return res.status(404).json({ message: 'Contrato no encontrado' });
  }

  db.contratos.splice(contratoIndex, 1);
  await writeDb(db);

  res.status(204).send();
});

app.post('/api/bulk/clientes', async (req, res) => {
    const db = await readDb();
    const nuevosClientes = req.body;
    const existingClientNames = new Set(db.clientes.map((c: Cliente) => c.nombre.toLowerCase()));
    const clientesAgregados = [];
    const clientesOmitidos = [];

    let nextId = db.clientes.length > 0 ? Math.max(...db.clientes.map((c: Cliente) => c.id)) + 1 : 1;

    for (const cliente of nuevosClientes) {
        if (existingClientNames.has(cliente.nombre.toLowerCase())) {
            clientesOmitidos.push(cliente.nombre);
        } else {
            const nuevoClienteConId = { ...cliente, id: nextId++ };
            clientesAgregados.push(nuevoClienteConId);
            existingClientNames.add(cliente.nombre.toLowerCase());
        }
    }

    if (clientesAgregados.length > 0) {
        db.clientes.push(...clientesAgregados);
        await writeDb(db);
    }

    let message = `${clientesAgregados.length} clientes agregados con éxito.`;
    if (clientesOmitidos.length > 0) {
        message += `
${clientesOmitidos.length} clientes omitidos por ser duplicados: ${clientesOmitidos.join(', ')}`;
    }

    res.status(201).json({ message });
});

const parseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
};

app.post('/api/bulk/contratos', async (req, res) => {
    const db = await readDb();
    const nuevosContratos = req.body;

    const existingFolios = new Set(db.contratos.map((c: Contrato) => c.folio));
    const clientNameToIdMap = new Map(db.clientes.map((c: Cliente) => [c.nombre.toLowerCase(), c.id]));

    const contratosAgregados = [];
    const contratosOmitidos = [];
    const contratosNoVinculados = [];

    let nextId = db.contratos.length > 0 ? Math.max(...db.contratos.map((c: Contrato) => c.id)) + 1 : 1;

    for (const contrato of nuevosContratos) {
        if (existingFolios.has(contrato.folio)) {
            contratosOmitidos.push(contrato.folio);
            continue;
        }

        const clienteId = clientNameToIdMap.get(contrato.clienteNombre?.toLowerCase());

        if (!clienteId) {
            contratosNoVinculados.push(contrato.nombreProyecto);
        }

        const nuevoContrato = {
            ...contrato,
            id: nextId++,
            clienteId: clienteId || 0, // 0 para 'Desconocido'
            fechaInicio: parseDate(contrato.fechaInicio),
            fechaTermino: parseDate(contrato.fechaTermino),
        };
        delete nuevoContrato.clienteNombre;

        contratosAgregados.push(nuevoContrato);
        existingFolios.add(contrato.folio);
    }

    if (contratosAgregados.length > 0) {
        db.contratos.push(...contratosAgregados);
        await writeDb(db);
    }

    let message = `${contratosAgregados.length} contratos agregados con éxito.`;
    if (contratosOmitidos.length > 0) {
        message += `
${contratosOmitidos.length} contratos omitidos por folio duplicado: ${contratosOmitidos.join(', ')}`;
    }
    if (contratosNoVinculados.length > 0) {
        message += `
${contratosNoVinculados.length} contratos no se pudieron vincular a un cliente: ${contratosNoVinculados.join(', ')}`;
    }

    res.status(201).json({ message });
});

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

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
