import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as storage from './storage.js';
import { translate } from './translateService.js';
import { seedIfEmpty } from './seed.js';

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/translate', async (req, res) => {
  try {
    const { term, role } = req.body || {};
    const result = await translate({ term, role });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/history', (_req, res) => {
  res.json(storage.getHistory());
});

app.get('/api/saved', (_req, res) => {
  res.json(storage.getSaved());
});

app.post('/api/saved/toggle', (req, res) => {
  try {
    const { term, role } = req.body || {};
    const saved = storage.toggleSave(term, role);
    res.json({ saved });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Jargon Translator backend listening on http://localhost:${PORT}`);
});
