# Testes Unitários

Este diretório contém os testes unitários para os novos componentes do Angela Quiz.

## Estrutura dos Testes

- `Reports.test.tsx` - Testes para a página de Relatórios e Estatísticas
- `Classes.test.tsx` - Testes para a página de Gerenciamento de Turmas
- `Assignments.test.tsx` - Testes para a página de Gerenciamento de Assignments
- `SharedQuizzes.test.tsx` - Testes para a página de Quizzes Compartilhados
- `StudentAttempts.test.tsx` - Testes para a página de Visualização de Tentativas dos Alunos
- `setup.ts` - Configuração global dos testes
- `mocks/server.ts` - Mock do servidor de API com MSW

## Como Executar os Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch
```bash
npm test -- --watch
```

### Executar testes com interface visual
```bash
npm run test:ui
```

### Executar testes com coverage
```bash
npm run test:coverage
```

### Executar testes uma única vez
```bash
npm run test:run
```

## Tecnologias Utilizadas

- **Vitest** - Framework de testes
- **React Testing Library** - Biblioteca para testar componentes React
- **MSW (Mock Service Worker)** - Para mock de APIs
- **jsdom** - Ambiente DOM para testes

## O que é Testado

### Reports Page
- Renderização da página com abas
- Carregamento e exibição de quizzes
- Mudança entre abas
- Exibição do painel de filtros
- Carregamento de estatísticas
- Opções de exportação
- Tratamento de erros

### Classes Page
- Renderização da página
- Carregamento e exibição de turmas
- Criação de novas turmas
- Edição de turmas existentes
- Matrícula de alunos
- Exclusão de turmas
- Tratamento de erros

### Assignments Page
- Renderização da página
- Carregamento e exibição de assignments
- Criação de novos assignments
- Edição de assignments
- Ativação/desativação
- Exclusão de assignments
- Tratamento de erros

### SharedQuizzes Page
- Renderização da página com abas
- Carregamento de quizzes recebidos e compartilhados
- Mudança entre abas
- Compartilhamento de quizzes
- Fork de quizzes
- Revogação de compartilhamento
- Tratamento de erros

### StudentAttempts Page
- Renderização da página (visão de professor e aluno)
- Carregamento e exibição de tentativas
- Filtros por quiz
- Exibição de estatísticas
- Tratamento de erros
- Estados vazios

## Boas Práticas

1. **Testes focados no comportamento do usuário**: Os testes simulam interações reais do usuário
2. **Mock de APIs**: Todas as chamadas de API são mockadas para garantir testes isolados
3. **Testes de estados de carregamento e erro**: Verificamos todos os estados possíveis dos componentes
4. **Testes de acessibilidade**: Verificamos se os elementos importantes estão presentes e acessíveis
5. **Testes de integração**: Verificamos a interação entre componentes e APIs

## Cobertura de Código

Os testes foram escritos para cobrir:
- Renderização de componentes
- Interações do usuário
- Chamadas de API
- Estados de carregamento
- Tratamento de erros
- Fluxos de usuário completos

## Próximos Passos

1. Adicionar mais testes de edge cases
2. Implementar testes de integração entre componentes
3. Adicionar testes de performance
4. Implementar testes E2E com Cypress ou Playwright