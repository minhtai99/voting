export enum PathUrl {
  VOTE = 'vote',
  FORGOT_PASSWORD = 'auth/reset-password',
}

export const getTokenUrl = (token: string, path: PathUrl) => {
  return `${process.env.FRONTEND_URL}/${path}?token=${token}`;
};
