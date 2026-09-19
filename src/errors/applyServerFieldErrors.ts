import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/lib';

const SERVER_FIELD_MESSAGE = 'The server rejected this value.';

/**
 * Puts the API's per-field `details[]` where react-hook-form already renders
 * local errors, so server validation and client validation land in the same
 * place on the screen.
 *
 * `fields` is an allowlist, not a convenience: `details[].field` is a
 * server-side name, and setting an error on a field the form does not render
 * gives the user a form that refuses to submit with nothing visible to fix.
 * Typing it as `Path<TValues>` is what checks each list against its own schema.
 */
export const applyServerFieldErrors = <TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fields: readonly Path<TValues>[],
): void => {
  if (!(error instanceof ApiError)) {
    return;
  }

  for (const detail of error.details) {
    const field = fields.find((candidate) => candidate === detail.field);

    if (field !== undefined) {
      setError(field, { message: SERVER_FIELD_MESSAGE });
    }
  }
};
