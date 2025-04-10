import path from 'path';
import { LogService } from '../../src/services/LogService';

const FIXTURES_PATH = '../fixtures';

describe('LogService', () => {
  let service: LogService;
  let filePath: string;

  beforeEach(() => {
    service = new LogService(path.resolve(__dirname, FIXTURES_PATH));
    filePath = 'twenty-line-log.txt';
  });

  describe('constructor', () => {
    it('defaults the root log directory to /var/log', () => {
      const defaultService = new LogService();
      expect(defaultService.rootLogDirectory).toEqual('/var/log');
    });

    it('accepts a custom root log directory', () => {
      expect(service.rootLogDirectory).toEqual(path.resolve(__dirname, FIXTURES_PATH));
    });
  });

  describe('.getLines', () => {
    it('returns log lines from newest to oldest', async () => {
      const result = await service.getLines(filePath);
      expect(result).toHaveLength(20);
      expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
      expect(result[result.length - 1]).toEqual('2025-04-02 18:45:41 earliest log line');
    });

    it('applies the requested limit', async () => {
      const result = await service.getLines(filePath, '', 5);
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
    });

    it('applies the requested filter', async () => {
      const result = await service.getLines(filePath, 'log line');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual('2025-04-07 15:08:15 latest log line');
      expect(result[1]).toEqual('2025-04-02 18:45:41 earliest log line');
    });

    describe('file path handling', () => {
      it('uses syslog by default', async () => {
        const result = await service.getLines();
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual('mock syslog content');
      });
    });
  });
});
