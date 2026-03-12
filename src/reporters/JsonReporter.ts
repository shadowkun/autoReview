import { writeFile } from 'fs/promises';
import type { TestResult } from '../core/types.js';

export class JsonReporter {
  async write(result: TestResult, outputPath: string): Promise<void> {
    const json = JSON.stringify(result, null, 2);
    await writeFile(outputPath, json, 'utf-8');
  }

  format(result: TestResult): string {
    return JSON.stringify(result, null, 2);
  }
}
