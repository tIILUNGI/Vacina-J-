<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vacina Já - Sistema de Gestão de Vacinação

Sistema de gestão de vaccinação desenvolvido com React, Vite, Express e SQLite.

## Funcionalidades Mobile

O sistema é **totalmente responsivo** e funciona em todos os tamanhos de ecrã:
- 📱 **Smartphones** - Menu mobile, touch-friendly
- 📲 **Tablets** - Layout adaptativo
- 💻 **Desktop** - Interface completa

## Executar Localmente

**Pré-requisitos:** Node.js

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Configurar a `GEMINI_API_KEY` em `.env.local` (opcional)

3. Executar a aplicação:
   ```bash
   npm run dev
   ```

4. Acesse: `http://localhost:3000`

---

## Deploy no Vercel

### Opção 1: Frontend no Vercel + Backend Separado (Recomendado)

Para fazer deploy no Vercel, você precisa de dois serviços:

#### Passo 1: Deploy do Backend

O backend com SQLite precisa de um servidor persistente. Use uma destas opções:

**Railway (Recomendado - gratuito):**
1. Crie conta em [railway.app](https://railway.app)
2. Crie um novo projeto "New" > "Empty Project"
3. Conecte seu repositório GitHub
4. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
5. Após deploy, você terá uma URL como `https://seu-backend.railway.app`

**Render.com:**
1. Crie conta em [render.com](https://render.com)
2. Crie "New Web Service"
3. Conecte seu repositório
4. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm run start`

#### Passo 2: Deploy do Frontend no Vercel

1. Crie conta em [vercel.com](https://vercel.com)
2. Importe seu repositório GitHub
3. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Nas Environment Variables, adicione:
   - `API_BASE_URL`: URL do seu backend (ex: `https://seu-backend.railway.app`)
5. Deploy automático!

### Opção 2: Deploy Completo (VPS/Servidor Dedicado)

```bash
# 1. Construir a aplicação
npm run build

# 2. Executar em produção
npm run start
```

O servidor estará disponível em `http://localhost:3000`

**Com PM2 (para manter o servidor a funcionar):**
```bash
npm install -g pm2
pm2 start server.ts --name vaccine-app
pm2 save
pm2 startup
```

---

## Configurações de Ambiente

Crie um ficheiro `.env` com as seguintes variáveis:

```env
# Chave da API Gemini (opcional - apenas para funcionalidades de IA)
GEMINI_API_KEY=sua_chave_aqui

# URL da aplicação
APP_URL=https://sua-app.vercel.app

# URL do backend (para Vercel com backend externo)
API_BASE_URL=https://seu-backend.railway.app

# Porta do servidor (padrão: 3000)
PORT=3000
```

---

## Utilizadores Iniciais

Após a primeira execução, são criados automaticamente:

| Username   | Password    | Função     |
|------------|-------------|------------|
| admin      | admin123    | Administrador |
| enfermeiro | pav123      | Enfermeiro  |

**⚠️ Recomendação:** Altere as passwords após o primeiro login!

---

## Base de Dados

O sistema usa SQLite (`vacina_ja.db`). Para produção:
- Faça backup regularmente do ficheiro `vacina_ja.db`
- Em ambiente cloud, use um volume persistente para o ficheiro da BD

---

## Scripts Disponíveis

| Comando         | Descrição                      |
|-----------------|--------------------------------|
| `npm run dev`   | Executar em modo desenvolvimento |
| `npm run build` | Construir para produção        |
| `npm run start` | Executar em modo produção      |
| `npm run preview`| Pré-visualizar build de produção |
