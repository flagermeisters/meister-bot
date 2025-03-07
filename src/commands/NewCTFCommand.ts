import { EmbedBuilder, Guild, MessageCreateOptions, TextChannel } from 'discord.js';
import { prefix } from '../const';
import { ValidMemberMessage } from '../utils/validateMessage';
import Command from './BaseCommand';
import { CtfChannel } from '../CtfChannel';
import { CtfCategory } from '../CtfCategory';

class NewCTFCommand extends Command {
  commandName = 'new ctf';
  usageHelp = `${prefix} ${this.commandName} <CTF-NAME> [CTF-URL] [USERNAME] [PASSWORD]`;
  commandDescription = 'Create a new CTF.';

  async execute(
    message: ValidMemberMessage,
    commandChannel: CtfChannel,
    commandCategory: CtfCategory,
    args: string[],
  ): Promise<void> {
    this.assertArgsLengthRange(args, 1, 4);

    const [categoryName, ctfUrl, ctfUsername, ctfPassword] = args;

    if (ctfUrl) this.assertValidUrl(ctfUrl);
    this.assertChannelNameIsValid(categoryName);
    this.assertChannelNotAlreadyExists(
      commandCategory.object.guild,
      categoryName,
    );

    const category = await CtfCategory.createCTF(categoryName, message.guild);
    const channel = await CtfChannel.createDiscussion(category);

    // Move the category to the top
    category.moveToTop();

    // Write the URL, username, and password to the channel topic
    const topic = this.createTopicString({
      URL: ctfUrl,
      Username: ctfUsername,
      Password: ctfPassword,
    });
    channel.setTopic(topic);

    // Send a formatted message in the discussion channel with CTF information
    await this.sendCtfInfoMessage(message, channel, categoryName, ctfUrl, ctfUsername, ctfPassword);

    message.reply(`New CTF \`${category.name}\` created: ${channel.ref}`);
  }

  /**
   * Creates and sends a formatted message with CTF information in the given channel
   * 
   * @param message Original message to get client access
   * @param channel The channel to send the message in
   * @param ctfName The name of the CTF
   * @param ctfUrl The URL of the CTF
   * @param ctfUsername The username for the CTF
   * @param ctfPassword The password for the CTF
   */
  async sendCtfInfoMessage(
    message: ValidMemberMessage,
    channel: CtfChannel,
    ctfName: string,
    ctfUrl?: string,
    ctfUsername?: string,
    ctfPassword?: string,
  ): Promise<void> {
    // Create an embed with CTF details
    const embed = new EmbedBuilder()
      .setDescription(
        `# 🚩 ${ctfName} 🚩\n\n` +
        '**Instructions**\n' +
        '1. Create a personal account on the CTF platform\n' +
        '2. Enter the team credentials below to join the team'
      )
      .setColor('#2986fb');
    
      const fields = [];
    
    if (ctfUrl) {
      fields.push({ 
        name: '🌐 **Website**', 
        value: `${ctfUrl}`, 
        inline: false 
      });
    }
    
    if (ctfUsername) {
      fields.push({ 
        name: '👤 **Team Login**', 
        value: `\`${ctfUsername}\``, 
        inline: true 
      });
    }
    
    if (ctfPassword) {
      fields.push({ 
        name: '🔑 **Password**', 
        value: `\`${ctfPassword}\``, 
        inline: true 
      });
    }
    
    fields.push({
      name: '🛠️ **Useful Commands**',
      value: 
        `• \`${prefix} new chall <name>\` - Create a challenge channel\n` +
        `• \`${prefix} solve <flag>\` - Mark a challenge as solved\n` +
        `• \`${prefix} help\` - List all available commands`,
      inline: false
    });
    
    embed.addFields(fields);
    
    embed.setFooter({ 
      text: 'Happy hacking and remember to write down your progress in the challenge channel!' 
    });
    
    // Get the channel ID from the channel reference and send the message
    const channelId = channel.ref.replace('<#', '').replace('>', '');
    const textChannel = await message.guild.channels.fetch(channelId) as TextChannel;
    
    if (textChannel) {
      await textChannel.send({ embeds: [embed] });
    }
  }

  createTopicString(topic: Record<string, string>): string {
    // Remove any empty values
    Object.entries(topic).forEach(([key, value]) => {
      if (!value) delete topic[key];
    });

    // Convert the object to a string
    return Object.entries(topic)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n');
  }

  /**
   *
   * @param message The message object
   * @param ctfName The name of the category
   * @throws Error if the category already exists
   */
  assertChannelNotAlreadyExists(guild: Guild, ctfName: string): void {
    const ctfCategory = CtfCategory.fromName(ctfName, guild);

    if (ctfCategory) {
      throw new Error(
        `CTF \`${ctfCategory.name}\` already exists: ${ctfCategory.children.at(
          0,
        )}`,
      );
    }
  }

  /**
   *
   * @param categoryName The name of the category
   * @throws Error if the category name is invalid
   */
  assertChannelNameIsValid(categoryName: string): void {
    if (categoryName === '') {
      throw new Error('Invalid category name.');
    }
  }

  /**
   *
   * @param url The URL to validate
   * @throws Error if the URL is invalid
   * @example
   * ```ts
   * this.assertValidUrl(url);
   * ```
   */
  assertValidUrl(url: string): void {
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL.');
    }
  }
}

export default NewCTFCommand;
