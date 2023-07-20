export enum MailEvent {
  SEND_MAIL_FORGOT_PASSWORD = 'sendEmailForgotPass',
  SEND_MAIL_INVITATION_VOTE = 'sendEmailInvitationVote',
  SEND_MAIL_ADD_INVITATION_VOTE = 'sendEmailAddInvitationVote',
  SEND_MAIL_POLL_ENDED_PARTICIPANT = 'sendEmailPollEndedParticipant',
  SEND_MAIL_POLL_ENDED_AUTHOR = 'sendEmailPollEndedAuthor',
  SEND_MAIL_VOTE_REMINDER = 'sendEmailVoteReminder',
}

export enum ProcessorName {
  FORGOT_PASSWORD = 'forgot-password',
  INVITATION_VOTE = 'invitation-vote',
  POLL_ENDED_PARTICIPANT = 'end-poll-participant',
  POLL_ENDED_AUTHOR = 'end-poll-author',
  VOTE_REMINDER = 'vote-reminder',
}
