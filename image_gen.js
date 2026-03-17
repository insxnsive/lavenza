import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config'

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateImage(prompt, userId) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        const fileName = `image-${Date.now()}-${userId}.png`;

        fs.writeFileSync(fileName, buffer);

        return fileName;
      }
    }
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    throw err;
  }
}