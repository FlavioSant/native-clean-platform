/**
 * Schemas for what the user types, consumed by react-hook-form. Schemas for
 * what the API returns are a different contract — those live in `api/schemas.ts`.
 * `policy.ts` groups everything that mirrors the API itself (constants, copy,
 * field schemas); the other files group the forms that travel together.
 */
export { type Credentials, type SignUpValues, signInSchema, signUpSchema } from './credentials';
export {
  type ChangePasswordValues,
  changePasswordSchema,
  type DeleteAccountValues,
  deleteAccountSchema,
  type ForgotPasswordValues,
  forgotPasswordSchema,
  type ResetPasswordValues,
  resetPasswordSchema,
} from './password';
export { PASSWORD_HINT, VERIFICATION_CODE_DIGITS } from './policy';
export { type ConfirmSignUpValues, confirmSignUpSchema } from './verification';
