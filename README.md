# Igreja Batista Nova Jerusalém — Sampaio

Plataforma web e PWA completa da **Igreja Batista Nova Jerusalém (Sampaio)**, integrando portal institucional, aplicativo do membro (**NJ App**) e painel administrativo com controle de acesso por perfil (**RBAC**).

## Principais Funcionalidades

- **Portal Institucional e Programação**: agenda semanal, destaques de cultos, player do *Informativo NJ* com reprodução otimizada, cards de eventos com artes exclusivas e modal de inscrição.
- **NJ App (Área do Membro)**: Escola Bíblica Dominical (EBD Digital), transmissões ao vivo e pregações via YouTube, discografia oficial do Ministério Nova Jerusalém integrada ao Spotify, pedidos de oração, dízimos/ofertas via Pix e anotações pessoais de cultos.
- **Gestão de Ministérios e Escalas**: painel de ministérios, escalas de voluntários, avisos, indisponibilidades e repertório de louvor com notificações em tempo real.
- **Painel Administrativo com RBAC**: controle de permissões em camadas (`superadmin`, `pastoral`, `lider`, `voluntario`, `membro`), gerenciamento da equipe e trilha de auditoria imutável.
- **PWA (Progressive Web App)**: instalável em dispositivos móveis e desktop com cache inteligente via Service Worker.

## Arquitetura e Tecnologias

- **Front-end**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion e Lucide Icons.
- **Banco de Dados e Autenticação**: Firebase Firestore (tempo real com `onSnapshot`) e Firebase Authentication (Login com Google).
- **Segurança**:
  - Regras declarativas de segurança no Firestore (`firestore.rules`) com validação de esquema, controle de acesso por papel no servidor e isolamento de dados pessoais (LGPD).
  - Validação de token Firebase ID (`firebase-admin/auth`), verificação de origem, rate limiting e cabeçalhos HTTP de segurança nas rotas de upload (`server.ts`).
  - Sanitização de URLs externas, incorporações Spotify/YouTube e tratamento estruturado de erros com `ErrorBoundary`.

## Como Executar Localmente

Pré-requisitos: **Node.js 20+** instalado.

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em ambiente de desenvolvimento (Vite + Express na porta 3000)
npm run dev

# 3. Verificar tipagem TypeScript
npm run lint

# 4. Gerar build de produção
npm run build
```

## Publicação no Firebase Hosting

O projeto já está configurado com `firebase.json` e `.firebaserc` prontos para deploy estático gratuito (plano Spark):

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

Para automatizar o deploy a cada `git push` na branch `main`, execute uma única vez no terminal local:

```bash
npx firebase-tools init hosting:github
```
