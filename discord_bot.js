import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
  } from "discord.js";
  
  import "dotenv/config";
  import { generateImage } from "./image_gen.js";
  import { registerMentionHandler } from "./gemini.js";
  import { agent } from "./config/config.js";
  import fs from "fs";

  
  const client = new Client({
    intents: [  
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
  });
  
  registerMentionHandler(client);

  
  const commands = [
    new SlashCommandBuilder()
      .setName("create")
      .setDescription("Generate an AI image")
      .addStringOption(option =>
        option
          .setName("prompt")
          .setDescription("Describe the image you want to generate")
          .setRequired(true)
      )
      .toJSON()
  ];
  
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  
  (async () => {
    try {
      console.log("[INIT] Registering slash command...");
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log("[INIT] Slash command registered.");
    } catch (error) {
      console.error("[INIT] Failed to register slash command:", error);
    }
  })();
  

  
  client.once("clientReady", async () => {
  
    console.clear();
  
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);


  
    function status(value) {
      if (value === undefined) return "❌ MISSING";
      if (value.trim() === "") return "⚠️ EMPTY";
      return "✅ SUCCESS";
    }
  
    console.log("Bot connected");
    console.log("User:", client.user.tag);
    console.log("ID:", client.user.id);
    console.log("Guilds:", client.guilds.cache.size);
    console.log("Started:", new Date().toLocaleString());
    console.log("");
  
    console.log("AI");
    console.log("  Model:", agent);
    console.log("  API_KEY:", status(process.env.API_KEY));
    console.log("");
  
    console.log("Environment");
    console.log("  DISCORD_TOKEN:", status(process.env.DISCORD_TOKEN));
    console.log("  CLIENT_ID:", status(process.env.CLIENT_ID));
    console.log("");
  
    console.log("System");
    console.log("  Node:", process.version);
    console.log("  Platform:", process.platform);
    console.log("");
  
    console.log("Guild Summary");
  
    for (const guild of client.guilds.cache.values()) {
  
      const textChannels = guild.channels.cache.filter(c => c.type === 0);
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2);
  
      console.log(`- ${guild.name}`);
      console.log(`   Members: ${guild.memberCount}`);
      console.log(`   Text: ${textChannels.size} | Voice: ${voiceChannels.size}`);
    }
  
    console.log("");
    console.log("Ready.\n");
  
  });
  

  
  client.on("interactionCreate", async interaction => {
  
    if (!interaction.isChatInputCommand()) return;
  
    console.log(
      `[CMD] /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name} / #${interaction.channel?.name}`
    );
  
    if (interaction.commandName === "create") {
  
      await interaction.deferReply();
  
      const prompt = interaction.options.getString("prompt");
      const userId = interaction.user.id;
  
      console.log("[PROMPT]", prompt);
  
      try {
  
        const filePath = await generateImage(prompt, userId);
  
        await interaction.editReply({
          content: `Image generated for <@${userId}>`,
          files: [filePath],
        });
  
        console.log("[SUCCESS] Image:", filePath);
  
        fs.unlinkSync(filePath);
  
      } catch (error) {
  
        console.error("[ERROR] Image generation failed:", error);
        await interaction.editReply("Failed to generate image.");
      }
    }
  });
  

  
  client.login(process.env.DISCORD_TOKEN);