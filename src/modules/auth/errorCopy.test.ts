import { API_ERROR_CODES } from '@/lib';

import { AUTH_ERROR_COPY } from './errorCopy';

describe('AUTH_ERROR_COPY', () => {
  it('gives every failure mode of the verification code the same words', () => {
    // The API answers one code for unknown, wrong, expired and exhausted. Copy
    // that guessed between them would be inventing an oracle the API refused.
    expect(AUTH_ERROR_COPY[API_ERROR_CODES.EMAIL_VERIFICATION_FAILED]).toBe(
      'That code is not valid. Request a new one and try again.',
    );
  });

  it('says nothing about which reset-token failure happened', () => {
    expect(AUTH_ERROR_COPY[API_ERROR_CODES.PASSWORD_RESET_FAILED]).toBe(
      'That token is not valid. Start the recovery again to get a new one.',
    );
  });

  it('carries no entry for a code the API can no longer send', () => {
    expect(Object.keys(AUTH_ERROR_COPY)).not.toContain('EMAIL_ALREADY_IN_USE');
  });
});
