import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  to: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subject: string;

  @IsNotEmpty()
  @ApiProperty()
  context: any;

  @IsString()
  @IsOptional()
  @ApiProperty()
  pathFile: string;
}
