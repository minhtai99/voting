import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @Transform((item) => item.value.map((e) => Number(e)))
  @IsOptional()
  @ApiProperty({ type: [Number], default: [] })
  answerOptions: number[] = [];
}
