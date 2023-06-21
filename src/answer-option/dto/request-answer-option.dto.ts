import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RequestAnswerOption {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  imageIndex?: number;
}
