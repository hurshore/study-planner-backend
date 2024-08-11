export enum ResponseMessage {
  INVALID_QUESTION = 'invalid question ID',
  NO_ASSESSMENT = 'assessment not found',
  NO_COURSE = 'course not found',
  NOT_AUTHORIZED = 'not authorized to view this assessment',
  RETRIEVAL_FAILED = 'failed to retrieve assessment results',
  SUBMISSION_FAILED = 'failed to submit assessment',
  SUBMISSION_SUCCESS = 'assessment submitted successfully',
  SUGGESTIONS_ALREADY_GENERATED = 'suggestions already generated',
  TOO_MANY_ANSWERS = 'the number of answers exceeds the number of questions in the course',
}
