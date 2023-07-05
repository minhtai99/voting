import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVoteDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  pollId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ default: null })
  input: string = null;

  @IsArray()
  @Transform((item) => item.value.map((e) => Number(e)))
  @IsOptional()
  @ApiProperty({ type: [Number], default: [] })
  answerOptions: number[] = [];
}
