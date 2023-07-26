import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @EventPattern('sendMailForgotPass')
  handleSendMailForgotPass(@Payload() sendMailDto: SendMailDto) {
    this.mailService.sendMail(sendMailDto, './forgot-password.hbs');
  }

  @EventPattern('sendMailInvitation')
  handleSendMailInvitation(@Payload() sendMailDto: SendMailDto) {
    this.mailService.sendMail(sendMailDto, './invitation-vote.hbs');
  }

  @EventPattern('sendMailReminder')
  handleSendMailReminder(@Payload() sendMailDto: SendMailDto) {
    this.mailService.sendMail(sendMailDto, './vote-reminder.hbs');
  }

  @EventPattern('sendMailPollEndedAuthor')
  handleSendMailEndPollAuthor(@Payload() sendMailDto: SendMailDto) {
    this.mailService.sendMailWithFile(sendMailDto, './end-poll-author.hbs');
  }

  @EventPattern('sendMailPollEndedParticipants')
  handleSendMailEndPollParticipant(@Payload() sendMailDto: SendMailDto) {
    this.mailService.sendMail(sendMailDto, './end-poll-participant.hbs');
  }
}
