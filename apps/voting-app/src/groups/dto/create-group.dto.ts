import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @MaxLength(200)
  @IsString()
  @Transform(({ value }) => value.trim().replace(/ +/g, ' '))
  @IsNotEmpty()
  @ApiProperty({ required: true })
  groupName: string;

  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @ApiProperty({ required: true, type: [Number] })
  members: number[];
}
