# Config

The app's environment variables, read and validated in a single place. Nothing
else in the code reads `process.env` directly.

## Constants

| Name           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `API_BASE_URL` | The API's base URL, without a trailing slash. Validated on import — a missing or malformed value takes the app down at boot, with a message naming the variable. |

## Functions

| Name                       | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `readApiBaseUrl(rawValue, isDevelopment?)` | Validates and normalises the base URL. Outside development (`__DEV__` by default) it requires `https://`. It exists separately from the constant so the failure modes are testable without re-importing the module. |
