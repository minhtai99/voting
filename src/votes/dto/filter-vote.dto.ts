import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FilterVoteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  size: number;

  @IsOptional()
  @ApiProperty({ required: false })
  where: any = {};

  @IsOptional()
  @ApiProperty({ required: false })
  select: any = null;

  @IsOptional()
  @ApiProperty({ required: false })
  orderBy: any = {};
}
