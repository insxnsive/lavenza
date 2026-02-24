import { GoogleGenAI } from "@google/genai";
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from "node:fs";
import 'dotenv/config'


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function main() {
  const rl = createInterface({ input, output});


  rl.on('SIGINT', () => {
    console.log('\nBye!');
    rl.close();
    process.exit(0);
  });
  
  while(true){
    try{
      const query = await rl.question('Descreva como quer a imagem que sera gerada: ');

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: query,
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("gemini-native-image.png", buffer);
          console.log("Image saved as gemini-native-image.png");
        }
      }
    } catch (err) {
      console.error("Error:", err.message);
    }
    }
  }

main();
