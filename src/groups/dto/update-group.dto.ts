import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateGroupDto extends PickType(CreateGroupDto, ['members']) {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  @ApiProperty()
  groupId: number;
}
