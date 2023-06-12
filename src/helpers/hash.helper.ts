import * as bcrypt from 'bcrypt';

export const hashData = async (data: string): Promise<string> => {
  const saltOrRounds = 10;
  return await bcrypt.hash(data, saltOrRounds);
};
