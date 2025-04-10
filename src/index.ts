import express from 'express';
import { LogService } from './services/LogService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const logService = new LogService();

app.get('/lines', async (req, res) => {
  const { filepath = '/var/log/syslog', filterQuery = '', limit = '100' } = req.query;

  const parsedLimit = parseInt(limit as string, 10);
  const resolvedLimit = isNaN(parsedLimit) ? 100 : parsedLimit;

  const results = await logService.getLines(
    filepath.toString(),
    filterQuery.toString(),
    resolvedLimit,
  );

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
