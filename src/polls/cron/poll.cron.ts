import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PollsService } from '../polls.service';
import { PollStatus } from '@prisma/client';

@Injectable()
export class PollSchedule {
  constructor(private readonly pollsService: PollsService) {}

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
          await this.pollsService.sendPollEmail(updatePoll.poll);
        }

        if (poll.status === PollStatus.ongoing) {
          const updatePoll = await this.pollsService.updatePollStatus(
            poll.id,
            PollStatus.completed,
          );
          await this.pollsService.sendPollEmail(updatePoll.poll);
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
