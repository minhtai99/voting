import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  MSG_EMPTY_COMPARE_DATA,
  MSG_EMPTY_HASH_DATA,
} from '../constants/message.constant';

export const hashData = async (data: string | null): Promise<string> => {
  if (!data) {
    throw new BadRequestException(MSG_EMPTY_HASH_DATA);
  }
  const saltOrRounds = bcrypt.genSaltSync(10);
  return await bcrypt.hash(data, saltOrRounds);
};

export const compareHashedData = async (
  data: string,
  hashedData: string,
): Promise<boolean> => {
  if (!data || !hashedData) {
    throw new BadRequestException(MSG_EMPTY_COMPARE_DATA);
  }
  return bcrypt.compareSync(data, hashedData);
};
