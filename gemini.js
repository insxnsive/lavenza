import { GoogleGenAI } from '@google/genai';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import 'dotenv/config';
import { runShellCommand } from './commands.js';
import { agent, modelConfig } from './config/config.js';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Main REPL loop ---
async function main() {
  const rl = createInterface({ input, output });
  const history = [];

  rl.on('SIGINT', () => {
    console.log('\nBye!');
    rl.close();
    process.exit(0);
  });

  while (true) {
    try {
      const query = await rl.question('Query: ');
      history.push({ role: 'user', parts: [{ text: query }] });

      while (true) {
        const response = await ai.models.generateContent({
          model: agent,
          contents: history,
          config: modelConfig,
        });

        const content = response.candidates?.[0]?.content;
        if (!content?.parts?.length) throw new Error('No content parts returned.');

        // IMPORTANT: store the model content exactly as returned (includes thoughtSignature)
        history.push(content);

        const functionCallParts = content.parts.filter(p => p.functionCall);

        // No tool call => normal assistant text answer
        if (functionCallParts.length === 0) {
          console.log(chalk.bgCyan('Lavenza v2.0: '), response.text);
          break;
        }

        // Execute all tool calls from this step (supports parallel calls)
        const functionResponseParts = [];
        for (const p of functionCallParts) {
          const { name, args } = p.functionCall;

          console.log(chalk.yellow(`[tool] calling ${name}(${JSON.stringify(args)})`));

          if (name !== 'runShellCommand') throw new Error(`Unknown tool: ${name}`);

          const result = await runShellCommand(args);

          console.log(chalk.grey(`[tool] result: ${result}`));

          functionResponseParts.push({
            functionResponse: {
              name,
              response: { result },
            },
          });
        }

        // Send tool results back
        history.push({ role: 'user', parts: functionResponseParts });
      }
    } catch (err) {
      console.error('-- this is awkward --\n', err.message);
    }
  }
}

main();
