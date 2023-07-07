import { PollsService } from './../polls/polls.service';
import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PollResultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  async createPollResult(pollId: number) {
    const answer: string[] = [];
    const poll = await this.pollsService.findPollById(pollId);
    poll.answerOptions.sort((a, b) => b._count.votes - a._count.votes);
    for (const answerOption of poll.answerOptions) {
      answer.push(
        `${answerOption.content} - ${answerOption._count.votes} votes`,
      );
    }
    await this.prisma.pollResult.create({
      data: {
        poll: {
          connect: {
            id: pollId,
          },
        },
        answer,
      },
    });
  }

  async getPollResultByPollId(pollId: number) {
    return await this.prisma.pollResult.findUnique({
      where: { pollId },
      include: {
        poll: {
          include: {
            author: true,
            invitedUsers: true,
            answerOptions: {
              include: {
                _count: true,
              },
            },
            votes: {
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                participant: true,
                answers: true,
              },
            },
          },
        },
      },
    });
  }
}
