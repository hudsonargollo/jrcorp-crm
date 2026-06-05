# JR-CORP CRM

Plataforma serverless de gestão de serviços ambientais e sanitários — Cloudflare Workers + Next.js.

## Estrutura

```
jrcorp/
├── worker/          # Cloudflare Worker (API)
│   ├── src/
│   │   ├── index.ts          # Router principal
│   │   ├── types.ts          # Tipos compartilhados
│   │   ├── kv.ts             # Camada de acesso ao KV
│   │   ├── scheduler.ts      # Geração automática de agenda
│   │   └── routes/
│   │       ├── clients.ts
│   │       ├── services.ts
│   │       └── invoices.ts
│   └── wrangler.toml
└── frontend/        # Next.js (Cloudflare Pages)
    └── src/
        ├── app/
        │   ├── admin/        # Painel administrativo
        │   └── client/       # Portal do cliente
        ├── components/
        └── lib/api.ts        # Cliente HTTP tipado
```

## Setup

### Worker (API)

```bash
cd worker
npm install

# Criar namespace KV
npx wrangler kv:namespace create JRCORP_KV
# Cole os IDs gerados no wrangler.toml

# Desenvolvimento local
npm run dev

# Deploy
npm run deploy
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edite NEXT_PUBLIC_API_URL para apontar ao Worker

npm run dev      # http://localhost:3000
npm run build    # Build estático para Cloudflare Pages
```

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clients` | Listar todos os clientes |
| POST | `/api/clients` | Criar cliente |
| GET | `/api/clients/:id` | Detalhe do cliente |
| PATCH | `/api/clients/:id` | Atualizar cliente |
| GET | `/api/services` | Todos os serviços (admin) |
| GET | `/api/clients/:id/services` | Serviços do cliente |
| POST | `/api/contracts` | Criar contrato recorrente (Dedetização / Coleta) |
| POST | `/api/request-service` | Solicitar Higienização (on-demand) |
| POST | `/api/clients/:id/services/:sid/complete` | Marcar serviço como concluído + gerar fatura |
| GET | `/api/clients/:id/certificates` | Certificados do cliente |
| POST | `/api/upload-certificate` | Upload de certificado |
| GET | `/api/clients/:id/invoices` | Faturas do cliente |
| POST | `/api/clients/:id/invoices/:iid/pay` | Marcar fatura como paga |

## Tipos de Serviço

| Tipo | Frequência | Certificado Gerado |
|------|------------|-------------------|
| DEDETIZACAO | 2× por ano (180 dias) | Certificado de Sanitização |
| COLETA_RESIDUOS | Mensal (12× por ano) | Manifesto de Resíduos |
| HIGIENIZACAO | Sob demanda | Relatório de Execução |
