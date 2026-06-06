# Lembraí Web

MVP multi-tenant de álbum colaborativo privado para eventos.

Perfis:

- `platform_admin`: administra a plataforma, cria gestores e vê todos os eventos.
- `event_manager`: faz login, cria um ou mais eventos, gera QR Code e baixa mídias dos próprios eventos.
- `guest`: não faz login, entra por `/e/[eventSlug]`, envia fotos/vídeos e vê somente os próprios envios daquele evento.

Não há galeria pública, moderação, comentários, curtidas, IA, reconhecimento facial ou app mobile nativo.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- AWS S3 privado
- Upload direto do browser para S3 por presigned URL
- Leitura/download por signed URL expirada

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

`SUPABASE_SERVICE_ROLE_KEY` é usado apenas nas APIs server-side para validar sessão, criar usuários gestores e aplicar regras de ownership.

## Setup Supabase

1. Crie um projeto no Supabase.
2. Preencha no `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Rode `supabase/schema.sql` manualmente no SQL Editor do Supabase.
4. Crie o primeiro usuário administrador pelo Supabase Auth e insira o profile `platform_admin` correspondente.
5. Depois faça login em `/login`.

Opcionalmente rode `supabase/seed.sql` e substitua `SUBSTITUA_PELO_AUTH_USER_ID` pelo usuário Auth do gestor Delson para criar o evento seed:

- evento: `isaac-1-ano`
- nome: `Aniversário de 1 ano do Isaac`

## Setup S3

1. Crie um bucket privado.
2. Crie credenciais IAM com permissão para `s3:PutObject` e `s3:GetObject` no bucket.
3. Preencha as variáveis AWS no `.env.local`.
4. Configure CORS do bucket.

Exemplo local:

```json
[
  {
    "AllowedHeaders": ["Content-Type", "*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Em produção, troque os origins pelo domínio real.

## Rotas

- Landing: `/`
- Login: `/login`
- Platform admin: `/admin`
- Criar gestor: `/admin/managers/new`
- Dashboard gestor: `/dashboard`
- Criar evento: `/dashboard/events/new`
- Painel do evento: `/dashboard/events/[eventSlug]`
- Convidado: `/e/[eventSlug]`

## Segurança implementada no MVP

- Managers autenticados via Supabase Auth.
- Guests sem login, com `guest_token` anônimo no `localStorage`.
- Managers só acessam eventos em que `events.manager_id` é o próprio usuário.
- Mídias são sempre consultadas pelo `event_id` e pela permissão do dono do evento.
- Guests só recebem mídias do próprio `guest_token` dentro daquele evento.
- `media.s3_key` segue o padrão:

```text
managers/{managerId}/events/{eventId}/guests/{guestId}/{mediaId}-{sanitizedFileName}
```

## Rodar localmente

```bash
npm install
npm run dev
```

## Verificação

```bash
npm run lint
npm run build
```
