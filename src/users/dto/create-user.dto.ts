import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

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
  @ApiProperty()
  password: string;

  @MaxLength(50)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @MaxLength(50)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;
}
