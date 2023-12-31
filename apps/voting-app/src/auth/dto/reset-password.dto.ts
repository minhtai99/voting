import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsJWT,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class ResetPassDto {
  @IsStrongPassword(
    {
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
      minLength: 5,
      minLowercase: 1,
    },
    {
      message:
        'Password must contain at least 1 number, 1 uppercase character and 1 special character',
    },
  )
  @MinLength(5)
  @IsString()
  @Transform(({ value }) => value.replace(/ +/g, ''))
  @ApiProperty()
  newPassword: string;

  @IsJWT({ message: 'This is not JWT' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
