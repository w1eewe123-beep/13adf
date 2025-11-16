// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Please set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in .env file');
  process.exit(1);
}

const client = new Client({
  intents: [ GatewayIntentBits.Guilds ]
});

// ------------- Register slash commands (guild for fast update) --------------
const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(opt => opt.setName('message').setDescription('Text to say').setRequired(true))
    .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Send ephemeral (only you see it)').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send an embed with title and description')
    .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
    .addStringOption(opt => opt.setName('color').setDescription('Hex color like #0099ff (optional)').setRequired(false))
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (err) {
    console.error('Error registering commands:', err);
  }
})();

// -------------- Bot events and command handling -----------------
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Set presence: Playing Nord
  try {
    await client.user.setPresence({
      activities: [{ name: 'Nord', type: ActivityType.Playing }],
      status: 'online'
    });
    console.log('Presence set to: Playing Nord');
  } catch (err) {
    console.warn('Failed to set presence:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'say') {
    const message = interaction.options.getString('message');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    // reply with same text (you can also send to channel)
    try {
      await interaction.reply({ content: message, ephemeral });
    } catch (err) {
      console.error('say command error:', err);
      if (!interaction.replied) await interaction.reply({ content: 'حدث خطأ', ephemeral: true });
    }
  }

  else if (commandName === 'embed') {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const colorInput = interaction.options.getString('color');

    // validate color (basic): accept hex like #RRGGBB or RRGGBB
    let color = undefined;
    if (colorInput) {
      const hex = colorInput.startsWith('#') ? colorInput.slice(1) : colorInput;
      if (/^[0-9A-Fa-f]{6}$/.test(hex)) color = `#${hex}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    if (color) embed.setColor(color);

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('embed command error:', err);
      if (!interaction.replied) await interaction.reply({ content: 'حدث خطأ عند إرسال الEmbed', ephemeral: true });
    }
  }
});

// login
client.login(DISCORD_TOKEN);
