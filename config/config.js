import { ThinkingLevel } from '@google/genai';
import { runShellDeclaration } from '../commands.js';
import { systemPrompt } from './prompt.js';

export const agent = 'gemini-3-flash-preview';

export const modelConfig = {
  thinkingConfig: {
    thinkingLevel: ThinkingLevel.LOW,
  },
  systemInstruction: systemPrompt,
  tools: [
    {
      functionDeclarations: [runShellDeclaration],
    },
  ],
  toolConfig: {
    functionCallingConfig: {
      mode: 'auto',
    },
  },
};

