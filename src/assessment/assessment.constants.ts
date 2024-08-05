export enum ResponseMessage {
  INVALID_QUESTION = 'invalid question ID',
  NO_ASSESSMENT = 'assessment not found',
  NO_COURSE = 'course not found',
  RETRIEVAL_FAILED = 'failed to retrieve assessment results',
  SUBMISSION_FAILED = 'failed to submit assessment',
  SUBMISSION_SUCCESS = 'assessment submitted successfully',
  TOO_MANY_ANSWERS = 'the number of answers exceeds the number of questions in the course',
}
