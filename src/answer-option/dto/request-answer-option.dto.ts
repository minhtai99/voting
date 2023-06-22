import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RequestAnswerOption {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  content: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @ApiProperty({ required: false })
  imageIndex?: number;
}
