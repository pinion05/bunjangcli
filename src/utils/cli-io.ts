import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output, stderr } from 'node:process';

export async function prompt(question: string, useStderr = false): Promise<string> {
  const rl = createInterface({ input, output: useStderr ? stderr : output });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}
