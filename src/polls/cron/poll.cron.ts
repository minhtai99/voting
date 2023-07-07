import { MailInvitationVote } from './../../mails/interfaces/send-mail.interface';
import { MailEvent } from './../../mails/mails.enum';
import { PollStatus } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PollsService } from '../polls.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PollResultService } from '../../poll-result/poll-result.service';

@Injectable()
export class PollSchedule {
  constructor(
    private readonly pollsService: PollsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pollResultService: PollResultService,
  ) {}

  private readonly logger = new Logger(PollSchedule.name);

  @Cron('0 */5 * * * *')
  async pollStatusEventHandler() {
    const polls = await this.pollsService.getAllPollForSchedule();
    Promise.all(
      polls.map(async (poll) => {
        if (poll.status === PollStatus.pending) {
          const payloadInvitation: MailInvitationVote = {
            pollId: poll.id,
            token: poll.token,
          };
          await this.pollsService.updatePollStatus(poll.id, PollStatus.ongoing);
          this.eventEmitter.emit(
            MailEvent.SEND_MAIL_INVITATION_VOTE,
            payloadInvitation,
          );
        }

        if (poll.status === PollStatus.ongoing) {
          await this.pollsService.updatePollStatus(
            poll.id,
            PollStatus.completed,
          );
          await this.pollResultService.createPollResult(poll.id);

          this.eventEmitter.emit(
            MailEvent.SEND_MAIL_POLL_ENDED_PARTICIPANT,
            poll.id,
          );

          this.eventEmitter.emit(
            MailEvent.SEND_MAIL_POLL_ENDED_AUTHOR,
            poll.id,
          );
        }
      }),
    )
      .then(() => {
        this.logger.log('Poll status event handler');
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
