import { MailEvent } from './../../mails/mails.enum';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PollsService } from '../polls.service';
import { PollStatus } from '@prisma/client';
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
    const polls = await this.pollsService.getAllPollForSchedule();
    Promise.all(
      polls.map(async (poll) => {
        if (poll.status === PollStatus.pending) {
          const updatePoll = await this.pollsService.updatePollStatus(
            poll.id,
            PollStatus.ongoing,
          );
          await this.pollsService.sendPollEmail(updatePoll.data);
        }

        if (poll.status === PollStatus.ongoing) {
          const updatePoll = await this.pollsService.updatePollStatus(
            poll.id,
            PollStatus.completed,
          );
          await this.pollsService.updatePollResultAnswer(poll.id);
          await this.pollsService.sendPollEmail(updatePoll.data);
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

  @Cron('0 */5 * * * *')
  async voteReminderEventHandler() {
    const polls = await this.pollsService.getAllPollForScheduleVoteReminder();
    Promise.all(
      polls.map(async (poll) => {
        this.eventEmitter.emit(MailEvent.SEND_MAIL_VOTE_REMINDER, poll.id);
      }),
    )
      .then(() => {
        this.logger.log('Vote reminder event handler');
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
