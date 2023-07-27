export enum MailEvent {
  SEND_MAIL_FORGOT_PASSWORD = 'sendEmailForgotPass',
  SEND_MAIL_INVITATION_VOTE = 'sendEmailInvitationVote',
  SEND_MAIL_POLL_ENDED_PARTICIPANT = 'sendEmailPollEndedParticipant',
  SEND_MAIL_POLL_ENDED_AUTHOR = 'sendEmailPollEndedAuthor',
  SEND_MAIL_VOTE_REMINDER = 'sendEmailVoteReminder',
}

export enum MailClientEvent {
  SEND_MAIL_FORGOT_PASSWORD = 'sendMailForgotPass',
  SEND_MAIL_INVITATION_VOTE = 'sendMailInvitation',
  SEND_MAIL_POLL_ENDED_PARTICIPANT = 'sendMailPollEndedParticipants',
  SEND_MAIL_POLL_ENDED_AUTHOR = 'sendMailPollEndedAuthor',
  SEND_MAIL_VOTE_REMINDER = 'sendMailReminder',
}
