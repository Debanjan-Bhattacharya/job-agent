import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '../fixtures');

export function loadFixture(relativePath: string): string | Record<string, unknown> {
  const fullPath = join(FIXTURES_DIR, relativePath);
  const content = readFileSync(fullPath, 'utf-8');
  if (relativePath.endsWith('.json')) {
    return JSON.parse(content) as Record<string, unknown>;
  }
  return content;
}
