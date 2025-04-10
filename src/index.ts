import express from 'express';
import { LogService } from './services/LogService';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_LOG_DIRECTORY = process.env.ROOT_LOG_DIRECTORY || '/var/log';

app.use(express.json());

const logService = new LogService(path.resolve(ROOT_LOG_DIRECTORY));

app.get('/lines', async (req, res) => {
  try {
    const { filePath = 'syslog', filterQuery = '', limit = '100' } = req.query;

    const parsedLimit = parseInt(limit as string, 10);
    const resolvedLimit = isNaN(parsedLimit) ? 100 : parsedLimit;

    const results = await logService.getLines(
      filePath.toString(),
      filterQuery.toString(),
      resolvedLimit,
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
