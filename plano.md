# Plano do Projeto — App de Quizzes (React + Vite, IA gratuita por APIs públicas)

> Objetivo: construir uma aplicação web simples para professores criarem quizzes sobre qualquer matéria. A app pode usar **APIs gratuitas na internet** (sem custos), preferindo serviços sem necessidade de cartão de crédito. Manter a solução enxuta: poucas dependências, UI clara, zero backend próprio.

---

## 1) Princípios

* **Gratuito**: só serviços com camadas grátis (free tier).
* **Simplicidade**: foco em criar perguntas e exportar; sem features pesadas.
* **Privacidade razoável**: mostramos aviso de que os textos enviados vão para APIs externas.
* **Portabilidade**: front-end 100% estático (Vite + React). Deploy em GitHub Pages/Netlify.

---

## 2) Stack mínima

* **Frontend**: React + Vite + TypeScript + TailwindCSS (opcional, mas leve).
* **Estado**: React hooks (`useState`, `useReducer`); sem store adicional.
* **Armazenamento**: `localStorage` (rápido) + export/import JSON.
* **PDF**: `pdfmake` (ou `jspdf` + `autoTable`).

---

## 3) Integrações de IA (gratuitas)

> Usar **adaptadores** simples para permitir escolher 1 de várias APIs gratuitas. O utilizador coloca a chave (se for preciso) nas **Definições** e fica guardada apenas no `localStorage`.

### 3.1 Texto (gerar perguntas)

* **Opção A (sem chave, melhor esforço)**: *Pollinations text endpoint* (gratuito, sem conta). Simples para protótipo.
* **Opção B (chave gratuita)**: **Hugging Face Inference API** com um modelo gratuito (ex.: `mistralai/Mistral-7B-Instruct`, `meta-llama/Meta-Llama-3-8B-Instruct` — quando disponíveis no free tier). Requer token gratuito do utilizador.

### 3.2 Imagens (ilustração opcional)

* **Opção A (sem chave)**: *Pollinations image endpoint* (gera imagens por prompt, gratuito; qualidade variável).
* **Opção B (chave gratuita)**: **Hugging Face Inference API** com `stabilityai/stable-diffusion-2` ou `stabilityai/sd-turbo`. Requer token gratuito.

> Nota: Como a app é simples, **não** faremos embeddings, pesquisa semântica nem PWA/offline agora.

---

## 4) Funcionalidades (MVP enxuto)

1. **Criar Quiz**

   * Título, disciplina, nível/ano.
   * Adicionar perguntas: múltipla escolha, verdadeiro/falso, resposta curta.
2. **Gerar Perguntas por IA (Texto)**

   * Campo de tema/tópicos + nº de perguntas.
   * Botão "Gerar" → chamadas à API escolhida → inserir como rascunho editável.
3. **Gerar Imagem (opcional)**

   * Prompt curto → pedir imagem → anexar à pergunta.
4. **Guardar/Carregar**

   * Guardar no `localStorage`.
   * Exportar/Importar `.quiz.json`.
5. **Exportar PDF**

   * Enunciado (sem soluções) e Gabarito (com soluções) em ficheiros separados.

---

## 5) Estrutura de Pastas (simplificada)

```text
quiz-ai/
├─ public/
│  └─ icons/                 # (opcional) ícones
├─ src/
│  ├─ app/
│  │  ├─ main.tsx
│  │  └─ router.tsx
│  ├─ components/
│  │  ├─ QuizForm.tsx
│  │  ├─ QuestionEditor.tsx
│  │  ├─ AiTextPanel.tsx
│  │  └─ AiImagePanel.tsx
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Create.tsx
│  │  └─ Settings.tsx
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ aiText.ts        # adaptador de IA texto (Pollinations/HF)
│  │  │  └─ aiImage.ts       # adaptador de IA imagem (Pollinations/HF)
│  │  ├─ export/
│  │  │  ├─ toJson.ts
│  │  │  └─ toPdf.ts
│  │  └─ utils/
│  │     ├─ storage.ts       # localStorage helpers
│  │     └─ validators.ts
│  ├─ types/quiz.ts
│  ├─ styles/index.css
│  └─ index.html (via Vite)
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ README.md
└─ LICENSE
```

---

## 6) Esquemas de Dados (mínimos)

```ts
// src/types/quiz.ts
export type QType = 'mcq' | 'truefalse' | 'short';

export interface Choice { id: string; text: string; correct?: boolean }

export interface Question {
  id: string;
  type: QType;
  prompt: string;      // Markdown simples
  imageUrl?: string;   // URL da imagem gerada
  choices?: Choice[];  // mcq/truefalse
  answer?: string;     // short
}

export interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 7) Fluxos de Utilização

1. **Novo Quiz** → preencher título/tema → adicionar perguntas manualmente **ou** clicar "Gerar por IA" → editar → guardar.
2. **Imagem opcional** → escrever prompt → gerar → anexar.
3. **Exportar** → JSON e PDF.
4. **Definições** → escolher fornecedor de IA (Pollinations/HF) + inserir token (se necessário).

---

## 8) Tarefas & Subtarefas

### 8.1 Bootstrap

* [ ] `npm create vite@latest` (React + TS) + Tailwind.
* [ ] Instalar `pdfmake` (ou `jspdf`).

### 8.2 Tipos & Estado

* [ ] Criar tipos (`src/types/quiz.ts`).
* [ ] Estado com `useReducer` no `Create.tsx` (adicionar/editar/remover perguntas).
* [ ] Persistência no `localStorage` (autosave simples).

### 8.3 UI Básica

* [ ] Home (lista de quizzes salvos + botões Novo/Importar).
* [ ] Create (form + lista de perguntas + preview simples).
* [ ] Settings (escolha de API + token opcional + teste de conectividade).

### 8.4 IA Texto

* [ ] `lib/api/aiText.ts` com função `generateQuestions({ provider, prompt, n })`.
* [ ] Implementar **Pollinations** (sem chave) e **Hugging Face** (com token gratuito).
* [ ] Templates de prompt curtos: tema, nível (básico/intermédio), tipo de pergunta.

### 8.5 IA Imagem (opcional)

* [ ] `lib/api/aiImage.ts` com `generateImage({ provider, prompt })`.
* [ ] Implementar **Pollinations** e **Hugging Face** (sd‑turbo) como alternativas.

### 8.6 Exportação

* [ ] Exportar JSON (`toJson.ts`).
* [ ] Exportar PDF (enunciado + gabarito) (`toPdf.ts`).

### 8.7 Validação mínima

* [ ] Validações simples: enunciado não vazio; MCQ com 1 correta.
* [ ] Avisos rápidos (toasts) em vez de regras complexas.

### 8.8 Documentação

* [ ] README com "Como obter token gratuito" (Hugging Face).
* [ ] Avisos de privacidade: texto enviado para terceiros quando usar API.

---

## 9) Critérios de Aceitação (MVP)

* Gera **3–5 perguntas** por tema usando um **fornecedor gratuito**.
* Permite anexar **1 imagem** por pergunta (opcional) a partir de fornecedor gratuito.
* Guarda/Carrega do `localStorage`; exporta **JSON** e **PDF** válidos.
* UI simples, sem navegação complexa.

---

## 10) Scripts

* `npm run dev` — Vite dev server
* `npm run build` — build produção
* `npm run preview` — pré‑visualização

---

## 11) Notas sobre custos e limites

* **Pollinations**: gratuito, sem chave (sujeito a latência/limites públicos).
* **Hugging Face Inference**: gratuito com token pessoal (limites de taxa podem aplicar-se). Sem custos obrigatórios.
* **Sem backend**: todas as chamadas são feitas diretamente do browser; o token (quando usado) fica no `localStorage`.

---

## 12) Entregáveis

* Repositório com a estrutura acima.
* `plano.md` (este documento) + `README.md` (instruções de chaves gratuitas).
* MVP funcional: gerar perguntas por IA e exportar PDF/JSON; geração de imagens opcional.
