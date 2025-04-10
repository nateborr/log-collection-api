import { promises as fsPromises } from 'fs';

export class LogService {
  async getLines(
    filePath: string = '/var/log/syslog',
    filterQuery: string = '',
    limit: number = 100,
  ): Promise<string[]> {
    const CHUNK_SIZE = 1024;
    const filterQueryAbsent = filterQuery.trim() === '';
    const results: string[] = [];

    const file = await fsPromises.open(filePath, 'r');
    try {
      // Start at the end of the file to process last logs first.
      const stats = await file.stat();
      let position = stats.size;
      let buffer = '';

      while (position > 0 && results.length < limit) {
        // Read the lesser of the chunk size and the remaining unread bytes in the file.
        const readSize = Math.min(CHUNK_SIZE, position);
        position -= readSize;

        const { buffer: bufferForChunk } = await file.read({
          buffer: Buffer.alloc(readSize),
          offset: 0,
          length: readSize,
          position,
        });

        buffer = bufferForChunk.toString() + buffer;
        const lines = buffer.split('\n');

        // Move any partial line to the buffer for the next iteration.
        buffer = lines.shift() ?? '';

        // Loop over the lines in reverse order and add matches to results
        // until the limit is reached or the lines from this chunk are exhausted.
        for (let i = lines.length - 1; i >= 0 && results.length < limit; i--) {
          const line = lines[i];
          if (filterQueryAbsent || line.includes(filterQuery)) {
            results.push(line);
          }
        }
      }

      // Get the final line from the buffer.
      if (buffer !== '') {
        results.push(buffer);
      }
    } finally {
      await file.close();
    }

    // return [`TODO ${filePath}, ${filterQuery}, ${limit}`];
    return results;
  }
}
