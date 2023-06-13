import * as bcrypt from 'bcrypt';

export const hashData = async (data: string): Promise<string> => {
  const saltOrRounds = 10;
  return await bcrypt.hash(data, saltOrRounds);
};

export const compareHashedData = async (
  data: string,
  hashedData: string,
): Promise<boolean> => {
  const isMatch = bcrypt.compareSync(data, hashedData);
  return isMatch;
};
