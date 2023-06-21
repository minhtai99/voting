import { ApiProperty } from '@nestjs/swagger';
import { AnswerOption } from '@prisma/client';

export class AnswerOptionDto implements AnswerOption {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false })
  pictureUrl: string;

  @ApiProperty()
  pollId: number;
}
