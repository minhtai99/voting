import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class FilterPollDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  size: number;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  isAuthor: boolean;

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
