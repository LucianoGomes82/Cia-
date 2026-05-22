# Listas CIA — Deploy no Cloudflare Pages

## Estrutura

```
listas-cia-v4-cf/
├── public/
│   └── index.html          ← App (single file)
├── functions/
│   ├── ml-proxy.js         ← Proxy JSON da API ML
│   ├── ml-token.js         ← Refresh OAuth token
│   └── ml-binary.js        ← Download de PDFs (etiquetas)
└── wrangler.toml           ← Config opcional
```

## Deploy via Dashboard (recomendado, +fácil)

### 1. Crie conta gratuita

https://dash.cloudflare.com/sign-up — sem cartão de crédito.

### 2. Pages → "Create a project"

- Clique em **"Direct Upload"** (mais fácil que Git pra começar)
- **Project name:** `listas-cia-v4` (ou outro)
- Faça upload do ZIP **completo** (a pasta com `public/` e `functions/` dentro)
- Clique em **"Deploy site"**

### 3. URL gerada

Algo como `https://listas-cia-v4.pages.dev` — já funciona!

### 4. Domínio próprio (opcional)

Pages → seu projeto → **Custom domains** → adicione seu domínio.
A Cloudflare gerencia DNS gratuitamente.

## Deploy via Git (recomendado pra produção)

### 1. Sobe o código pro GitHub/GitLab

```bash
cd listas-cia-v4-cf
git init && git add . && git commit -m "Initial"
git remote add origin <seu-repo>
git push -u origin main
```

### 2. Conecta no Cloudflare Pages

- Pages → **"Create a project"** → **"Connect to Git"**
- Autoriza GitHub/GitLab
- Escolhe o repo
- Configurações:
  - **Build command:** (deixa vazio)
  - **Build output directory:** `public`
- **Save and Deploy**

A partir daí cada `git push` faz deploy automático.

## Variáveis de ambiente

Se quiser configurar o `client_id` e `client_secret` da app ML como variáveis (ao invés de digitar no app), vá em:

**Pages → seu projeto → Settings → Environment variables**

Adicione (não obrigatório, app funciona sem):
- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`

## Limites do plano grátis

| Recurso | Limite |
|---|---|
| Bandwidth | **Ilimitado** |
| Requests/dia | 100.000 (Workers) |
| Builds/mês | 500 |
| Custom domains | 100 |
| Sites concorrentes | Ilimitado |

## Diferenças vs Netlify

- ✅ Endpoints mais limpos: `/ml-proxy` ao invés de `/.netlify/functions/ml-proxy`
- ✅ CDN global mais rápida (data center mais próximo do usuário)
- ✅ Bandwidth ilimitada
- ✅ Sem cláusula de "uso comercial restrito"
- ✅ Suporte nativo a binários (sem precisar base64)

## Desenvolvimento local

Se quiser testar localmente antes de fazer deploy:

```bash
npm install -g wrangler
cd listas-cia-v4-cf
wrangler pages dev public
```

Aí abra `http://localhost:8788`.
