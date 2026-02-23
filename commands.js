import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const ALLOWED_COMMANDS = ['ls', 'pwd', 'cat', 'echo', 'whoami', 'date'];

export async function runShellCommand({ command }) {
  const firstWord = command.trim().split(/\s+/)[0];
  if (!ALLOWED_COMMANDS.includes(firstWord)) {
    return `Command "${firstWord}" is not allowed.`;
  }
  try {
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr || '(no output)';
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

export const runShellDeclaration = {
  name: 'runShellCommand',
  description: 'Run a safe, allowlisted shell command and return its stdout output.',
  parameters: {
    type: 'OBJECT',
    properties: {
      command: {
        type: 'STRING',
        description: 'The shell command to execute, e.g. "ls -la" or "cat file.txt".',
      },
    },
    required: ['command'],
  },
};

export const toolFunctions = {
  runShellCommand,
};

