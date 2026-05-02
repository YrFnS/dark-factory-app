import { promises as fs } from 'fs';
import path from 'path';
import type { LogEntry } from '@/types/log';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILES: Array<{ agent: string; file: string }> = [
  { agent: 'plan', file: 'plan.log' },
  { agent: 'implement', file: 'implement.log' },
  { agent: 'test', file: 'test.log' },
];

const filePositions: Map<string, number> = new Map();

async function readNewLines(filePath: string, agent: string): Promise<LogEntry[]> {
  try {
    const stats = await fs.stat(filePath);
    const currentSize = stats.size;
    const lastPos = filePositions.get(filePath) ?? 0;

    if (currentSize <= lastPos) {
      if (currentSize < lastPos) filePositions.set(filePath, 0);
      return [];
    }

    const fd = await fs.open(filePath, 'r');
    try {
      const bytesToRead = currentSize - lastPos;
      const buffer = Buffer.alloc(bytesToRead);
      await fd.read(buffer, 0, bytesToRead, lastPos);
      const content = buffer.toString('utf-8');
      filePositions.set(filePath, currentSize);

      const lines = content.split('\n').filter((l) => l.trim() !== '');
      const entries: LogEntry[] = [];

      for (const line of lines) {
        const entry = parseLogLine(line, agent);
        if (entry) entries.push(entry);
      }

      return entries;
    } finally {
      await fd.close();
    }
  } catch {
    return [];
  }
}

function parseLogLine(line: string, agent: string): LogEntry | null {
  const match = line.match(/^\[(.+?)\] \[(\w+)\] \[PHASE-\d+\] (\w+): (.*)$/);
  if (match) {
    const timestamp = match[1] ?? '';
    const loggedAgent = match[2] ?? agent;
    const level = (match[3] ?? 'INFO') as LogEntry['level'];
    const message = match[4] ?? '';
    return { timestamp, agent: loggedAgent.toLowerCase() as LogEntry['agent'], phase: '', level, message };
  }
  return { timestamp: new Date().toISOString(), agent: agent as LogEntry['agent'], phase: '', level: 'INFO', message: line };
}

async function initPositions(): Promise<void> {
  for (const { file: _file } of LOG_FILES) {
    const filePath = path.join(LOGS_DIR, _file);
    try {
      const stats = await fs.stat(filePath);
      filePositions.set(filePath, stats.size);
    } catch {
      filePositions.set(filePath, 0);
    }
  }
}

export async function GET(): Promise<Response> {
  await initPositions();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const interval = setInterval(async () => {
        for (const { file, agent } of LOG_FILES) {
          const filePath = path.join(LOGS_DIR, file);
          const entries = await readNewLines(filePath, agent);
          for (const entry of entries) {
            send(JSON.stringify(entry));
          }
        }
      }, 500);

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // already closed
        }
      }, 15000);

      return () => {
        clearInterval(interval);
        clearInterval(pingInterval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
