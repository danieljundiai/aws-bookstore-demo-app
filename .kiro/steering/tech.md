# Stack e comandos

## Frontend (`assets/`)
- React 16 + TypeScript 4, criado com `react-scripts` 3.0.1 (Create React App).
- UI: React Bootstrap 0.32 e Bootstrap 3. Rotas: React Router 4. Auth e API: AWS Amplify 1.x.
- Telemetria: `aws-rum-web`.

Comandos (rodar dentro de `assets/`):
- `npm install`
- `npm run start`: servidor de desenvolvimento (processo longo, não rodar em primeiro plano em automações).
- `npm run build`
- `npm test -- --watchAll=false`: execução única dos testes.

## Backend (`functions/`)
- Funções Lambda em Node.js 16 (`.js`) e Python 3.8/3.9 (`.py`), definidas inline nos templates ou empacotadas pelo pipeline.
- Handlers Node usam `exports.handler = (event, context, callback)` e o `aws-sdk` v2 (`AWS.DynamoDB.DocumentClient`).
- O corpo da requisição chega como string JSON em `event.body`. O usuário vem de `event.requestContext.identity.cognitoIdentityId`.
- Variáveis de ambiente usadas: `TABLE_NAME`, `CART_TABLE`, `ORDERS_TABLE`, `URL`, `FILE_NAME`. Defina novas variáveis no template CloudFormation.

## Infraestrutura (`template/`)
- `master-fullstack.yaml`: template principal.
- `master-fullstack-with-lambda-warmers.yaml`: mesma stack com Lambda warmers.
- `bookstore-cognito-user.yaml`: criação de usuário Cognito.
- Mudanças em recursos AWS devem ser feitas nos templates, não no console.
- Mantenha os dois templates master consistentes quando a mudança valer para ambos.

## Convenções
- Siga o estilo do arquivo que estiver editando (aspas duplas e `"use strict";` nas Lambdas Node, componentes de função/classe TSX como nos módulos existentes).
- Toda Lambda exposta pelo API Gateway deve retornar imediatamente quando `event.source === "warmer"`.
- Não adicione dependências sem necessidade e não faça refatorações fora do escopo pedido.
- Não rode `cdk`, `aws cloudformation deploy` ou qualquer comando que crie recursos AWS sem pedido explícito.
