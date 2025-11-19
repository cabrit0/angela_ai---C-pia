# Quiz com IA

Aplicação de quizzes interativa desenvolvida com React, TypeScript e Vite, utilizando inteligência artificial para gerar perguntas dinâmicas.

## Tecnologias Utilizadas

- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Superset do JavaScript para tipagem estática
- **Vite** - Ferramenta de build rápida para desenvolvimento
- **TailwindCSS** - Framework CSS para estilização
- **React Router** - Navegação entre páginas
- **pdfmake** - Geração de PDFs para exportação de resultados

## Estrutura do Projeto

```
src/
├── app/              # Componentes principais da aplicação
│   ├── main.tsx      # Ponto de entrada principal
│   └── router.tsx    # Configuração de rotas
├── components/       # Componentes reutilizáveis
├── pages/            # Páginas da aplicação
│   ├── Home.tsx      # Página inicial
│   ├── Quiz.tsx      # Página do quiz
│   └── Results.tsx   # Página de resultados
├── lib/              # Bibliotecas e utilitários
│   ├── api/          # Comunicação com APIs
│   ├── export/       # Funcionalidades de exportação
│   └── utils/        # Funções utilitárias
├── types/            # Definições de tipos TypeScript
└── styles/           # Estilos globais
```

## Funcionalidades

- ✅ Geração de quizzes com IA
- ✅ Interface responsiva e intuitiva
- ✅ Sistema de pontuação
- ✅ Exportação de resultados em PDF
- ✅ Navegação entre páginas

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd quiz-ai-app
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra http://localhost:5173 no seu navegador

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run preview` - Visualiza a build de produção
- `npm run lint` - Executa o linter

## Desenvolvimento

Este projeto está configurado com:
- ESLint para análise de código
- TypeScript para tipagem estática
- TailwindCSS para estilização rápida
- Vite para desenvolvimento rápido com Hot Module Replacement

## Próximos Passos

- [ ] Implementar integração real com API de IA
- [ ] Adicionar sistema de autenticação
- [ ] Implementar armazenamento de resultados
- [ ] Adicionar mais categorias de quizzes
- [ ] Implementar modo multiplayer
