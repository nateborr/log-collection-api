import fs from 'fs';
import path from 'path';

const targetDirectory = './tmp';
const filename = 'mock-big-log.txt';
const fullPath = path.resolve(targetDirectory, filename);
const totalLines = 13_000_000;

// Start the dates of log lines N seconds ago, where N is the number of lines to generate.
const startTime = new Date(Date.now() - totalLines * 1000);

const stream = fs.createWriteStream(fullPath, { flags: 'w' });

function generateLine(timestamp: Date): string {
  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 1000);
  const z = Math.floor(Math.random() * 1_000_000);

  return `${timestamp.toLocaleString('sv-SE')} mock log content rand10(${x}) rand1000(${y}) rand1000000(${z})\n`;
}

async function generateLogFile() {
  console.log(`Generating ${totalLines.toLocaleString()} log lines to ${fullPath}`);
  let currentTime = new Date(startTime);

  for (let i = 0; i < totalLines; i++) {
    if (!stream.write(generateLine(currentTime))) {
      await new Promise<void>((resolve, reject) => {
        stream.once('drain', resolve);
        stream.once('error', reject);
      });
    }

    currentTime = new Date(currentTime.getTime() + 1000);
    if (i % 100_000 === 0) {
      console.log(`...${i.toLocaleString()} lines written`);
    }
  }

  stream.end(() => {
    console.log('Log file generation complete');
  });
}

generateLogFile().catch((err) => {
  console.error('Failed to generate log file:', err);
  process.exit(1);
});
