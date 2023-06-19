import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ResetPassDto } from 'src/auth/dto/reset-password.dto';

export class ChangePassDto extends OmitType(ResetPassDto, ['token']) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  currentPassword: string;
}
