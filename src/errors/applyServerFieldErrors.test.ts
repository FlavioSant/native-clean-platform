import type { UseFormSetError } from 'react-hook-form';

import { API_ERROR_CODES, ApiError } from '@/lib';

import { applyServerFieldErrors } from './applyServerFieldErrors';

interface Values {
  email: string;
  code: string;
}

const FIELDS = ['email', 'code'] as const;

const validationError = (field: string) =>
  new ApiError({
    status: 400,
    code: API_ERROR_CODES.VALIDATION_ERROR,
    message: 'never rendered',
    details: [{ field, code: 'invalid_format' }],
  });

describe('applyServerFieldErrors', () => {
  it('puts a server field error on the matching form field', () => {
    const setError = jest.fn() as unknown as UseFormSetError<Values>;

    applyServerFieldErrors<Values>(validationError('email'), setError, FIELDS);

    expect(setError).toHaveBeenCalledWith('email', { message: 'The server rejected this value.' });
  });

  it('ignores a field this form does not render', () => {
    // Otherwise the form refuses to submit and shows nothing to fix.
    const setError = jest.fn() as unknown as UseFormSetError<Values>;

    applyServerFieldErrors<Values>(validationError('password'), setError, FIELDS);

    expect(setError).not.toHaveBeenCalled();
  });

  it('ignores an error that is not an ApiError', () => {
    const setError = jest.fn() as unknown as UseFormSetError<Values>;

    applyServerFieldErrors<Values>(new Error('boom'), setError, FIELDS);

    expect(setError).not.toHaveBeenCalled();
  });
});
