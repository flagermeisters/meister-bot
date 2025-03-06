import { Client, GatewayIntentBits, Options } from 'discord.js';
import ArchiveCommand from './commands/ArchiveCommand';
import NewCTFCommand from './commands/NewCTFCommand';
import NewChallCommand from './commands/NewChallCommand';
import SolvedCommand from './commands/SolvedCommand';
import TestRoleCommand from './commands/TestRoleCommand';
import { adminRoleID, botToken, prefix } from './const';
import { validateMessage, ValidMemberMessage } from './utils/validateMessage';
import HelpCommand from './commands/HelpCommand';
import { CtfChannel } from './CtfChannel';
import ResolvedCommand from './commands/ResolveCommand';
import PingCommand from './commands/PingCommand';
import VersionCommand from './commands/VersionCommand';
import UnsolveCommand from './commands/UnsolveCommand';
import fuzzyMatch from './utils/fuzzyMatch';

const isProduction = process.env.NODE_ENV === 'production';

// Log startup environment
console.log(`Starting Meister bot in ${isProduction ? 'production' : 'development'} mode`);

// Configure client with appropriate options based on environment
const clientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  // Add production optimizations using the Options factory
  ...(isProduction && {
    makeCache: Options.cacheWithLimits({ 
      MessageManager: 200,
      PresenceManager: 0,
    }),
    sweepers: {
      messages: {
        interval: 3600, // 1 hour
        lifetime: 7200  // 2 hours
      }
    }
  })
};

const client = new Client(clientOptions);

if (!adminRoleID) {
  console.error('ADMIN_ROLE_ID is not defined in your environment variables.');
  process.exit(1);
} else if (!botToken) {
  console.error(
    'DISCORD_BOT_TOKEN is not defined in your environment variables.',
  );
  process.exit(1);
}

const commands = [
  new NewChallCommand(client, null),
  new NewCTFCommand(client, adminRoleID),
  new SolvedCommand(client, null),
  new ResolvedCommand(client, null),
  new UnsolveCommand(client, null),
  new TestRoleCommand(client, null, adminRoleID),
  new ArchiveCommand(client, adminRoleID),
  new PingCommand(client, null),
  new VersionCommand(client, null),
];
commands.push(new HelpCommand(client, null, commands));
const commandNames = commands.map((command) => command.commandName);

client.once('ready', () => {
  console.log(`Meister is ready! (Version: ${require('../package.json').version})`);
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.member) return;
  if (!message.inGuild()) return;
  if (!message.channel.parent) return;

  const channel = CtfChannel.fromMessage(message as ValidMemberMessage);
  if (!channel.isEmpty) return;

  channel.setUnsolvedName();
});

client.on('messageCreate', (message) => {
  if (!validateMessage(message)) return;

  const botCommand = message.content.slice(prefix.length).trim();
  const botCommandLower = botCommand.toLowerCase();

  // Exact matching with early return
  for (const command of Object.values(commands)) {
    if (botCommandLower.startsWith(command.commandName)) {
      const argString = botCommand.slice(command.commandName.length).trim();
      command.handleCommand(message, argString);
      return;
    }
  }

  // Fuzzy matching
  const commandName = botCommand.split(' ')[0];
  const matches = fuzzyMatch(commandName, commandNames);
  let response = 'Invalid command.';
  if (matches.length > 0) {
    response += ` Did you mean: \`${matches.join('`, `')}\`?`;
  }
  message.reply(response);
});

// Add graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('Received SIGINT. Bot is shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Bot is shutting down...');
  client.destroy();
  process.exit(0);
});

client.login(botToken).catch(console.error);
