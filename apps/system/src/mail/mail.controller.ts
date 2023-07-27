import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendMailDto } from './dto/send-mail.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProcessorName } from './mail.enum';

@Controller()
export class MailController {
  constructor(
    @InjectQueue('send-email') private readonly sendEmailQueue: Queue,
  ) {}

  @EventPattern('sendMailForgotPass')
  async handleSendMailForgotPass(@Payload() sendMailDto: SendMailDto) {
    sendMailDto.template = './forgot-password.hbs';
    await this.sendEmailQueue.add(ProcessorName.SEND_EMAIL, sendMailDto);
  }

  @EventPattern('sendMailInvitation')
  async handleSendMailInvitation(@Payload() sendMailDto: SendMailDto) {
    sendMailDto.template = './invitation-vote.hbs';
    await this.sendEmailQueue.add(ProcessorName.SEND_EMAIL, sendMailDto);
  }

  @EventPattern('sendMailReminder')
  async handleSendMailReminder(@Payload() sendMailDto: SendMailDto) {
    sendMailDto.template = './vote-reminder.hbs';
    await this.sendEmailQueue.add(ProcessorName.SEND_EMAIL, sendMailDto);
  }

  @EventPattern('sendMailPollEndedParticipants')
  async handleSendMailEndPollParticipant(@Payload() sendMailDto: SendMailDto) {
    sendMailDto.template = './end-poll-participant.hbs';
    await this.sendEmailQueue.add(ProcessorName.SEND_EMAIL, sendMailDto);
  }

  @EventPattern('sendMailPollEndedAuthor')
  async handleSendMailEndPollAuthor(@Payload() sendMailDto: SendMailDto) {
    sendMailDto.template = './end-poll-author.hbs';
    await this.sendEmailQueue.add(
      ProcessorName.SEND_EMAIL_WITH_FILE,
      sendMailDto,
    );
  }
}
