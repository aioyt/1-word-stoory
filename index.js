
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits } = require('discord.js');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Track one-word story channels and the last user to post in each
const oneWordStoryChannels = new Set();
const lastUserInChannel = new Map();

// Login to Discord with your client's token
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle commands
client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if this is the one-word story command
  if (message.content.toLowerCase() === '!onewordstory') {
    // Check if user has permission to manage channels
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('You need the Manage Channels permission to use this command.');
    }

    // Add channel to one-word story channels
    oneWordStoryChannels.add(message.channelId);
    
    await message.channel.send('This channel is now a one-word story channel! Each user can only send one word at a time and must wait for someone else to send a message before sending another.');
    return;
  }

  // Check if message is in a one-word story channel
  if (oneWordStoryChannels.has(message.channelId)) {
    // Check if user was the last to post
    const lastUser = lastUserInChannel.get(message.channelId);
    if (lastUser === message.author.id) {
      await message.delete();
      const warningMsg = await message.channel.send(`${message.author}, you must wait for someone else to contribute before posting again.`);
      // Delete the warning message after 5 seconds
      setTimeout(() => warningMsg.delete().catch(err => console.error('Error deleting message:', err)), 5000);
      return;
    }

    // Check if message is a single word
    const words = message.content.trim().split(/\s+/);
    if (words.length !== 1) {
      await message.delete();
      const warningMsg = await message.channel.send(`${message.author}, in the one-word story channel, you can only send one word at a time.`);
      // Delete the warning message after 5 seconds
      setTimeout(() => warningMsg.delete().catch(err => console.error('Error deleting message:', err)), 5000);
      return;
    }

    // Update last user
    lastUserInChannel.set(message.channelId, message.author.id);
  }
});

// Handle errors
client.on('error', console.error);

// Login with token
client.login(token).catch(error => {
  console.error('Error logging in:', error.message);
});
