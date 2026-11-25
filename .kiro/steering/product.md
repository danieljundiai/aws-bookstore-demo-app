# Produto

AWS Bookstore Demo App é uma aplicação full-stack de exemplo (loja de livros fictícia) que mostra o uso de vários bancos de dados AWS especializados. Todo o ambiente é criado por templates CloudFormation.

Funcionalidades: navegar e buscar livros, recomendações, best sellers, carrinho, checkout e histórico de pedidos.

| Funcionalidade | Serviço AWS |
|---|---|
| Catálogo, carrinho, pedidos | DynamoDB |
| Busca full-text | Amazon Elasticsearch/OpenSearch Service |
| Recomendações por amigos | Neptune (grafo) |
| Top 20 best sellers | ElastiCache for Redis (alimentado por DynamoDB Streams) |
| API | API Gateway + Lambda |
| Autenticação | Cognito (User Pool + Identity Pool) |
| Hospedagem do frontend | S3 + CloudFront |
| CI/CD | CodeCommit, CodePipeline, CodeBuild |

Este é um projeto de demonstração, não de produção. Veja "Considerations for demo purposes" e "Known limitations" no `README.md` antes de propor mudanças de arquitetura.
