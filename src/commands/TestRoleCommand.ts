import { Message } from 'discord.js';
import BaseCommand from './BaseCommand';

class TestRoleCommand extends BaseCommand {
  private adminRoleId: string;

  constructor(client: any, adminRoleId: string) {
    super(client);
    this.adminRoleId = adminRoleId;
  }

  execute(message: Message<true>): void {
    const userName = message.member?.user.username;
    if (this.hasRoleId(message, this.adminRoleId)) {
      message.reply(`User ${userName} is allowed`);
    } else {
      message.reply(`User ${userName} is NOT allowed`);
    }
  }
}

export default TestRoleCommand;
