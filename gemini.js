import { GoogleGenAI } from "@google/genai";
import { agent, modelConfig } from "./config/config.js";
import { runShellCommand } from "./commands.js";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function registerMentionHandler(client) {

  client.on("messageCreate", async (message) => {

    if (message.author.bot) return;


    if (!message.mentions.has(client.user)) return;


    const query = message.content
      .replace(`<@${client.user.id}>`, "")
      .trim();

    if (!query) return;

    await message.channel.sendTyping();

    try {

      const history = [
        { role: "user", parts: [{ text: query }] }
      ];

      const response = await ai.models.generateContent({
        model: agent,
        contents: history,
        config: modelConfig,
      });

      const content = response.candidates?.[0]?.content;
      if (!content?.parts?.length) {
        return message.reply("...The Velvet Room is silent.");
      }

      const functionCallParts = content.parts.filter(p => p.functionCall);

      if (functionCallParts.length === 0) {
        return message.reply(response.text);
      }

      const functionResponseParts = [];

      for (const p of functionCallParts) {
        const { name, args } = p.functionCall;

        if (name !== "runShellCommand")
          return message.reply("This power is not part of the contract.");

        const result = await runShellCommand(args);

        functionResponseParts.push({
          functionResponse: {
            name,
            response: { result },
          },
        });
      }

      history.push({ role: "user", parts: functionResponseParts });

      const secondResponse = await ai.models.generateContent({
        model: agent,
        contents: history,
        config: modelConfig,
      });

      return message.reply(secondResponse.text);

    } catch (err) {
      console.error(err);
      message.reply("An anomaly has disturbed the Velvet Room...");
    }

  });

}