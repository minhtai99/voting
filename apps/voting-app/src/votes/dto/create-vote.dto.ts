import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  isArray,
} from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ default: null })
  input: string = null;

  @IsArray()
  @Transform((item) => (isArray(item.value) ? item.value : [item.value]))
  @IsOptional()
  @ApiProperty({ type: [Number], default: [] })
  answerOptions: number[] = [];
}
