import { UserDto } from './../../users/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from '@prisma/client';
import { Type } from 'class-transformer';

export class GroupDto implements Group {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiProperty()
  creatorId: number;

  @ApiProperty({ type: UserDto })
  @Type(() => UserDto)
  creator: UserDto;

  @ApiProperty({ isArray: true, type: UserDto })
  @Type(() => UserDto)
  members: UserDto[];
}
