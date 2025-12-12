import { EventEmitter } from "events";
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, REST, Routes, EmbedBuilder } from "discord.js";

import { commands } from "./commands/index.ts";

// guild = discord server
class DiscordBot extends EventEmitter {
  private client: Client;
  private clientId: string;
  private token: string;
  private logGuildId: string = "1157764771681144924";
  private logsChannelId: string = "1158084205658517584";
  private commands: Collection<string, any>;

  constructor() {
    super();

    this.clientId = process.env["DISCORD_CLIENT_ID"] as string;
    this.token = process.env["DISCORD_TOKEN"] as string;

    if (!this.clientId || !this.token) {
      throw new Error("Missing DISCORD_CLIENT_ID or DISCORD_TOKEN environment variables");
    }

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
    this.commands = new Collection();

    // this.deleteCommands();
    // this.deployCommands();
    this.setupCommands();
    this.setupEventHandlers();
    this.connect();
  }

  private async deployCommands() {
    const commandsData = this.getCommandsData();

    const rest = new REST().setToken(this.token);

    try {
      console.log(`Started refreshing ${commandsData.length} application (/) commands across all guilds.`);

      // Wait for client to be ready before accessing guilds
      await new Promise((resolve) => {
        if (this.client.isReady()) {
          resolve(undefined);
        } else {
          this.client.once(Events.ClientReady, () => resolve(undefined));
        }
      });

      console.log(`Askobot is in ${this.client.guilds.cache.size} guilds`);

      // Deploy to each guild
      let deployedCount = 0;
      for (const guild of this.client.guilds.cache.values()) {
        try {
          await rest.put(Routes.applicationGuildCommands(this.clientId, guild.id), {
            body: commandsData,
          });
          console.log(`Deployed commands to ${guild.name} (${guild.id})`);
          deployedCount++;
        } catch (error) {
          console.error(`Failed to deploy to ${guild.name}:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log(`Successfully deployed commands to ${deployedCount}/${this.client.guilds.cache.size} guilds.`);
    } catch (error) {
      console.error("Error deploying commands:", error);
    }
  }

  private deleteCommands() {
    const rest = new REST().setToken(this.token);

    rest
      .put(Routes.applicationCommands(this.clientId), { body: [] })
      .then(() => console.log("Successfully deleted all application commands."))
      .catch(console.error);
  }

  private setupCommands() {
    // Load commands into the collection
    for (const command of commands) {
      if ("data" in command && "execute" in command) {
        this.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] A command is missing a required "data" or "execute" property.`);
      }
    }
  }

  private getCommandsData() {
    const commandsData = [];
    for (const command of commands) {
      if ("data" in command && "execute" in command) {
        try {
          commandsData.push(command.data.toJSON());
        } catch (error) {
          console.error(`Error preparing command:`, command, error);
        }
      } else {
        console.log(`[WARNING] A command is missing a required "data" or "execute" property.`);
      }
    }
    return commandsData;
  }

  private setupEventHandlers() {
    this.client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
    this.client.once(Events.ClientReady, this.handleReady.bind(this));
    this.client.on(Events.GuildCreate, this.handleGuildJoin.bind(this));
  }

  private async handleInteraction(interaction: any) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  private async handleReady(readyClient: Client) {
    console.log(`Discord Bot Ready! Logged in as ${readyClient.user?.tag}`);

    // Set bot status with no activity (just online)
    this.client.user?.setPresence({
      status: "online",
    });

    this.emit("ready");
  }

  private async handleGuildJoin(guild: any) {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    const commandsData = this.getCommandsData();

    const rest = new REST().setToken(this.token);

    try {
      await rest.put(Routes.applicationGuildCommands(this.clientId, guild.id), {
        body: commandsData,
      });
      console.log(`Successfully deployed ${commandsData.length} commands to ${guild.name}`);
    } catch (error) {
      console.error(`Failed to deploy commands to ${guild.name}:`, error instanceof Error ? error.message : String(error));
    }
  }

  // Send a message to a specific channel in a guild
  public async say(guildId: string, channelId: string, message: string, embeds?: EmbedBuilder[]) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.error(`Guild not found: ${guildId}`);
        return;
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel || !("send" in channel)) {
        console.error(`Channel not found or not text-based: ${channelId}`);
        return;
      }

      await channel.send({
        content: message,
        embeds: embeds || [],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // Function used to log into the log channel on discord
  public async log(embed: EmbedBuilder) {
    try {
      const guild = this.client.guilds.cache.get(this.logGuildId);
      if (!guild) {
        console.error(`Log guild not found: ${this.logGuildId}`);
        return;
      }

      const channel = guild.channels.cache.get(this.logsChannelId);
      if (!channel || !("send" in channel)) {
        console.error(`Log channel not found or not text-based: ${this.logsChannelId}`);
        return;
      }

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Error sending log message:", error);
    }
  }

  private connect() {
    this.client.login(this.token);
  }

  public async disconnect() {
    await this.client.destroy();
  }
}

const discordBot = new DiscordBot();
export default discordBot;
