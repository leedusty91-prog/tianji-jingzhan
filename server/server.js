import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Database Setup ---
const DB_PATH = join(__dirname, 'data', 'records.json');

/** @typedef {{ records: Array<import('../src/types/index').DivinationRecord> }} DbSchema */
/** @type {Low<DbSchema>} */
const adapter = new JSONFile(DB_PATH);
const defaultData = { records: [] };
const db = new Low(adapter, defaultData);

await db.read();

// --- Express App ---
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// GET /api/records — list all records (newest first)
app.get('/api/records', (_req, res) => {
  const sorted = [...db.data.records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

// GET /api/records/:id — get single record
app.get('/api/records/:id', (req, res) => {
  const record = db.data.records.find((r) => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record);
});

// POST /api/records — create a new record
app.post('/api/records', async (req, res) => {
  const { question, notes, date, gender, hexCode, hexName, hexNature } = req.body;

  if (!hexCode || !hexName) {
    return res.status(400).json({ error: 'hexCode and hexName are required' });
  }

  const record = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    date: date || new Date().toISOString().slice(0, 10),
    question: question || '',
    notes: notes || '',
    gender: gender || 'other',
    hexCode,
    hexName,
    hexNature: hexNature || '',
  };

  db.data.records.push(record);
  await db.write();

  res.status(201).json(record);
});

// DELETE /api/records/:id — delete a record
app.delete('/api/records/:id', async (req, res) => {
  const index = db.data.records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  db.data.records.splice(index, 1);
  await db.write();

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`⚡ 天纪经占 API server running at http://localhost:${PORT}`);
});
