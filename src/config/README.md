# Config

Variáveis de ambiente do app, lidas e validadas em um único lugar. Nada mais
no código lê `process.env` diretamente.

## Constants

| Name           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `API_BASE_URL` | URL base da API, sem barra no final. Validada no import — um valor ausente ou malformado derruba o app no boot, com mensagem nomeando a variável. |

## Functions

| Name                       | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `readApiBaseUrl(rawValue, isDevelopment?)` | Valida e normaliza a URL base. Fora de desenvolvimento (`__DEV__` por padrão) exige `https://`. Existe separada da constante para que os modos de falha sejam testáveis sem reimportar o módulo. |
