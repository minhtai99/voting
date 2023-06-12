import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Matching } from 'src/utils/decorators';

export class RegisterAuthDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsStrongPassword(
    {
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain at least 1 number, 1 uppercase character and 1 special character',
    },
  )
  @MinLength(8)
  @IsString()
  @ApiProperty()
  password: string;

  @Matching<RegisterAuthDto>('password')
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  confirmPassword: string;

  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;
}
