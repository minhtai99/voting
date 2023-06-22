import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class FilterPollDto {
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
