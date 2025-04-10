import path from 'path';
import { promises as fsPromises } from 'fs';

export class LogService {
  readonly CHUNK_SIZE = 131_072;

  constructor(public readonly rootLogDirectory: string = '/var/log') {}

  async getLines(
    filePath: string = 'syslog',
    filterQuery: string = '',
    limit: number = 100,
  ): Promise<string[]> {
    const results: string[] = [];

    const resolvedFilePath = this.resolveFilePath(filePath);

    const file = await fsPromises.open(resolvedFilePath, 'r');
    try {
      // Start at the end of the file to process last logs first.
      const stats = await file.stat();
      let position = stats.size;
      let buffer = '';

      while (position > 0 && results.length < limit) {
        // Read the lesser of the chunk size and the remaining unread bytes in the file.
        const readSize = Math.min(this.CHUNK_SIZE, position);
        position -= readSize;

        const { buffer: bufferForChunk, bytesRead } = await file.read({
          buffer: Buffer.alloc(readSize),
          offset: 0,
          length: readSize,
          position,
        });

        // Only process the number of bytes actually read.
        buffer = bufferForChunk.toString('utf-8', 0, bytesRead) + buffer;
        const lines = buffer.split('\n');

        // Move any partial line to the buffer for the next iteration.
        buffer = lines.shift() ?? '';

        results.push(...this.filterAndLimitLines(lines, filterQuery, limit - results.length));
      }

      // Handle the final line from the buffer.
      if (buffer && results.length < limit) {
        results.push(...this.filterAndLimitLines([buffer], filterQuery, limit - results.length));
      }
    } finally {
      await file.close();
    }

    return results;
  }

  private filterAndLimitLines(lines: string[], filterQuery: string, limit: number): string[] {
    const filterQueryAbsent = filterQuery === '';
    const matchingLines: string[] = [];

    // Loop over the lines in reverse order and add matches to results
    // until the limit is reached or the lines from this chunk are exhausted.
    for (let i = lines.length - 1; i >= 0 && matchingLines.length < limit; i--) {
      const line = lines[i];
      if (filterQueryAbsent || line.includes(filterQuery)) {
        matchingLines.push(line);
      }
    }

    return matchingLines;
  }

  private resolveFilePath(relativePath: string): string {
    const resolvedFilePath = path.resolve(this.rootLogDirectory, relativePath);

    if (!resolvedFilePath.startsWith(this.rootLogDirectory)) {
      throw new Error('File path traversal not allowed');
    }

    return resolvedFilePath;
  }
}
