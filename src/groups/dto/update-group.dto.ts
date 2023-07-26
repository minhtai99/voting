import { PickType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PickType(CreateGroupDto, ['members']) {}
