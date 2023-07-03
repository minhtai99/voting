import { MailInvitationVotePayload } from '../../mails/interfaces/send-mail.interface';
import { MailEvent } from './../../mails/mails.enum';
import { PollStatus } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PollsService } from '../polls.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PollSchedule {
  constructor(
    private readonly pollsService: PollsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(PollSchedule.name);

  @Cron('0 */5 * * * *')
  async pollStatusEventHandler() {
    try {
      const polls = await this.pollsService.getAllPollForSchedule();
      polls.map(async (poll) => {
        if (poll.status === PollStatus.pending) {
          this.updateStatusPoll(poll.id, PollStatus.ongoing);

          const invitationVotePayload: MailInvitationVotePayload = {
            inviter: poll.author,
            invitedUsers: poll.invitedUsers,
            pollId: poll.id,
          };
          this.eventEmitter.emit(
            MailEvent.SEND_MAIL_INVITATION_VOTE,
            invitationVotePayload,
          );
        }
      });
      this.logger.log('Poll status event handler');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateStatusPoll(pollId: number, status: PollStatus) {
    await this.pollsService.updatePrismaPoll({
      where: { id: pollId },
      data: { status },
    });
  }
}
