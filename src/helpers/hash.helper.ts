import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  MSG_ERROR_METHOD,
  MSG_NOT_MATCH,
} from 'src/constants/message.constant';

export const hashData = async (data: string): Promise<string> => {
  try {
    const saltOrRounds = 10;
    return await bcrypt.hash(data, saltOrRounds);
  } catch {
    throw new InternalServerErrorException(MSG_ERROR_METHOD(hashData.name));
  }
};

export const compareHashedData = async (
  data: string,
  hashedData: string,
): Promise<boolean> => {
  try {
    const isMatch = bcrypt.compareSync(data, hashedData);
    return isMatch ? isMatch : false;
  } catch (error) {
    throw new BadRequestException(MSG_NOT_MATCH);
  }
};
