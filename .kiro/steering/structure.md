# Estrutura do repositório

```
assets/                  Frontend React (TypeScript)
  src/
    App.tsx, Routes.tsx  Shell da aplicação e rotas
    config.ts            Região, URL da API e IDs do Cognito
    common/              Componentes compartilhados (Hero, StarRating, AddToCart, FriendRecommendations)
    modules/             Uma pasta por funcionalidade: bestSellers, cart, category, checkout,
                         friends, notFound, pastPurchases, search, signup
    types/               Tipos TypeScript compartilhados
functions/
  APIs/                  Lambdas chamadas pelo API Gateway (carrinho, livros, checkout, busca, recomendações)
  setup/uploadBooks.js   Carga inicial do catálogo
  streaming/             Lambdas disparadas por streams (updateBestSellers, updateSearchCluster)
template/                Templates CloudFormation
.github/                 Templates de issue e de pull request
```

## Onde mexer
- Nova tela ou funcionalidade de UI: crie uma pasta em `assets/src/modules/<nome>/` e registre a rota em `assets/src/Routes.tsx`.
- Componente reutilizado por mais de um módulo: `assets/src/common/`.
- Novo endpoint: um arquivo em `functions/APIs/`, mais o recurso Lambda, a permissão IAM e o método no API Gateway em `template/master-fullstack*.yaml`.
- Estilos ficam em arquivos `.css` ao lado do componente.

## Cuidados
- `assets/src/config.ts` contém IDs de uma implantação de exemplo (API, User Pool, Identity Pool). Não substitua por valores reais de outra conta em commits e não adicione segredos ou credenciais ao repositório.
- `*.lock` está no `.gitignore`.
- Documentação detalhada de arquitetura está em `README.md` e `assets/README.md`.

## Contribuição
- Siga `CONTRIBUTING.md`: mudanças focadas, sem reformatar código não relacionado, mensagens de commit claras.
- Preencha o template de `.github/PULL_REQUEST_TEMPLATE.md` ao abrir PRs.
