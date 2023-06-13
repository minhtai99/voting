import * as bcrypt from 'bcrypt';

export const compareData = async (
  data: string,
  hashedData: string,
): Promise<boolean> => {
  const isMatch = bcrypt.compareSync(data, hashedData);
  return isMatch;
};
