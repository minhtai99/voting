import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import Mail from 'nodemailer/lib/mailer';

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
  template?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  attachments?: Mail.Attachment[];
}
