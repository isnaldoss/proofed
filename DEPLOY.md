# Proofed - Deploy Guide (MongoDB Version)

## Pré-requisitos

### 1. Cloudinary

1. Acesse https://cloudinary.com/users/register_free
2. Crie uma conta gratuita
3. No Dashboard, anote:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. MongoDB Atlas

1. Acesse https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Crie um Cluster (Shared / Free)
4. Em "Database Access", crie um usuário e senha
5. Em "Network Access", permita acesso de qualquer IP (0.0.0.0/0)
6. Clique em "Connect" → "Drivers" e copie a **Connection String**
   - Substitua `<password>` pela sua senha

### 3. Vercel

1. Acesse https://vercel.com/signup
2. Faça login com GitHub
3. Conecte seu repositório

## Deploy na Vercel

### Passo 1: Push para GitHub

```bash
git add .
git commit -m "Migração para Cloudinary + MongoDB"
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
MONGODB_URI=sua_connection_string_do_mongo
```

### Passo 4: Deploy

Clique em "Deploy". O projeto deve subir sem erros!

## Desenvolvimento Local

1. Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

2. Preencha as variáveis do Cloudinary e MongoDB

3. Execute:

```bash
npm run dev
```

## Custos

- ✅ **Cloudinary**: Grátis até 25GB
- ✅ **MongoDB Atlas**: Grátis (512MB)
- ✅ **Vercel**: Grátis

**Total: R$ 0,00/mês** 🎉
