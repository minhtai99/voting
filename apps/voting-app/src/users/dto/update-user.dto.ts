import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password']),
) {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  avatarUrl?: string;
}
