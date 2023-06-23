import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, MinDate, ValidateIf } from 'class-validator';
import { GreaterComparison } from 'src/decorators/greater-comparison.decorator';
import { CreatePollDto } from './create-poll.dto';

export class CreateDraftPollDto extends OmitType(CreatePollDto, ['endDate']) {
  @GreaterComparison<CreateDraftPollDto>('startDate')
  @ValidateIf((e) => e.startDate)
  @MinDate(new Date())
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  @ApiProperty({ required: false })
  endDate: Date;
}
