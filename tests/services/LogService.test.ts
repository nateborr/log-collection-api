import path from 'path';
import { LogService } from '../../src/services/LogService';

const FIXTURES_PATH = '../fixtures';

describe('LogService', () => {
  let service: LogService;

  beforeEach(() => {
    service = new LogService();
  });

  it('returns log lines from newest to oldest', async () => {
    const filePath = path.resolve(__dirname, FIXTURES_PATH, 'twenty-line-log.txt');

    const result = await service.getLines(filePath);
    expect(result).toHaveLength(20);
    expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
    expect(result[result.length - 1]).toEqual('2025-04-02 18:45:41 earliest log line');
  });

  it('applies the requested limit', async () => {
    const filePath = path.resolve(__dirname, FIXTURES_PATH, 'twenty-line-log.txt');

    const result = await service.getLines(filePath, '', 5);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
  });

  it('applies the requested filter', async () => {
    const filePath = path.resolve(__dirname, FIXTURES_PATH, 'twenty-line-log.txt');

    const result = await service.getLines(filePath, 'log line');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
    expect(result[1]).toEqual('2025-04-02 18:45:41 earliest log line');
  });
});
