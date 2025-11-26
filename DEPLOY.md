# Proofed - Deploy Guide

## Pré-requisitos

### 1. Cloudinary

1. Acesse https://cloudinary.com/users/register_free
2. Crie uma conta gratuita
3. No Dashboard, anote:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Vercel

1. Acesse https://vercel.com/signup
2. Faça login com GitHub
3. Conecte seu repositório

## Deploy na Vercel

### Passo 1: Push para GitHub

```bash
git add .
git commit -m "Migração para Cloudinary + Vercel Postgres"
git push
```

### Passo 2: Criar Projeto na Vercel

1. Acesse https://vercel.com/new
2. Selecione seu repositório `proofed`
3. Clique em "Import"

### Passo 3: Configurar Variáveis de Ambiente

Na tela de configuração, adicione:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

### Passo 4: Adicionar Vercel Postgres

1. Após o deploy inicial, vá no projeto na Vercel
2. Clique em "Storage" → "Create Database"
3. Selecione "Postgres"
4. Clique em "Continue" → "Create"
5. A Vercel vai adicionar automaticamente as variáveis de ambiente do banco

### Passo 5: Executar Schema SQL

1. No Vercel Dashboard, vá em "Storage" → Seu banco Postgres
2. Clique em "Query"
3. Cole o conteúdo do arquivo `schema.sql`
4. Clique em "Run Query"

### Passo 6: Redeploy

1. Vá em "Deployments"
2. Clique nos 3 pontinhos do último deploy
3. Clique em "Redeploy"

Pronto! Seu Proofed está no ar! 🎉

## Desenvolvimento Local

1. Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

2. Preencha as variáveis do Cloudinary

3. Para o banco local, você pode:

   - Usar o banco da Vercel (copie as variáveis do dashboard)
   - Ou instalar Postgres localmente

4. Execute:

```bash
npm run dev
```

## Custos

- ✅ **Cloudinary**: Grátis até 25GB de storage e 25GB de bandwidth/mês
- ✅ **Vercel**: Grátis para projetos pessoais
- ✅ **Vercel Postgres**: Grátis até 256MB de storage

**Total: R$ 0,00/mês** 🎉
