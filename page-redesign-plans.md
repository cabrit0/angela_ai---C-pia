# Page Redesign Plans

## Home Page (Quiz List)

### Current Issues
- Basic layout with limited visual hierarchy
- Inconsistent spacing and typography
- Cards lack visual appeal and interaction feedback
- Mobile responsiveness needs improvement
- Action buttons are not well-organized

### Redesign Goals
- Create a modern, welcoming dashboard experience
- Improve visual hierarchy and information architecture
- Enhance quiz cards with better interaction patterns
- Optimize for mobile-first experience
- Add subtle animations and micro-interactions

### New Layout Structure

#### Header Section
```jsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a2 2 0 11-4 0 2 2 0 014 0zm8 7a2 2 0 11-4 0 2 2 0 014 0zm8 7a2 2 0 11-4 0 2 2 0 014 0zm8 7a2 2 0 11-4 0 2 2 0 014 0zm8 7a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Quiz com IA</h1>
        </div>
        <p className="text-sm text-gray-600 hidden sm:block">Crie quizzes inteligentes</p>
      </div>
      <button className="btn-ghost">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572-1.065c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
</header>
```

#### Hero Section
```jsx
<section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
  <div className="container mx-auto">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Crie Quizzes Incríveis com IA
      </h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
        Transforme seu conteúdo em quizzes envolventes com o poder da inteligência artificial. 
        Perfeito para educadores, estudantes e profissionais.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Criar Novo Quiz
        </button>
        <button className="btn-secondary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Importar Quiz
        </button>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{quizzes.length}</div>
        <div className="text-sm text-gray-600">Quizzes Criados</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{totalQuestions}</div>
        <div className="text-sm text-gray-600">Total de Perguntas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{completedQuizzes}</div>
        <div className="text-sm text-gray-600">Quizzes Concluídos</div>
      </div>
    </div>
  </div>
</section>
```

#### Quiz Cards Grid
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Meus Quizzes</h2>
      <div className="flex items-center space-x-4">
        <button className="btn-ghost text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
          </svg>
          Filtrar
        </button>
        <select className="input text-sm max-w-xs">
          <option value="all">Todos</option>
          <option value="recent">Recentes</option>
          <option value="completed">Concluídos</option>
        </select>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  </div>
</section>
```

## Create Quiz Page

### Current Issues
- Form layout is basic and lacks visual hierarchy
- Question editor is not intuitive
- AI panel integration feels disconnected
- Mobile experience is suboptimal
- No clear progress indication

### Redesign Goals
- Create a step-by-step wizard interface
- Improve form organization and validation
- Better integrate AI generation workflow
- Enhance mobile experience
- Add progress indicators and visual feedback

### New Layout Structure

#### Header with Progress
```jsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button className="btn-ghost">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
          </svg>
          Voltar
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a2 2 0 11-4 0 2 2 0 014 0zm8 7a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Criar Quiz</h1>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="btn-ghost">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Definições
        </button>
      </div>
    </div>
  </div>
</header>
```

#### Progress Indicator
```jsx
<div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
  <div className="container mx-auto">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          currentStep === 1 ? 'bg-blue-500' : 'bg-gray-300'
        }`}>
          <span className="text-white font-medium">1</span>
        </div>
        <div className={`h-1 w-16 ${
          currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'
        }`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          currentStep === 2 ? 'bg-blue-500' : 'bg-gray-300'
        }`}>
          <span className="text-white font-medium">2</span>
        </div>
        <div className={`h-1 w-16 ${
          currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'
        }`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          currentStep === 3 ? 'bg-blue-500' : 'bg-gray-300'
        }`}>
          <span className="text-white font-medium">3</span>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        {currentStep === 1 && 'Informações Básicas'}
        {currentStep === 2 && 'Perguntas'}
        {currentStep === 3 && 'Revisão e Publicação'}
      </div>
    </div>
  </div>
</div>
```

#### Step 1: Basic Information
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto max-w-2xl">
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
        <p className="text-gray-600 mb-6">
          Preencha as informações básicas do seu quiz. Estes detalhes ajudarão a organizar 
          e identificar seu conteúdo.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Título do Quiz</label>
          <input type="text" className="input" placeholder="Digite um título atrativo" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Disciplina</label>
          <select className="input">
            <option value="">Selecione uma disciplina</option>
            <option value="matematica">Matemática</option>
            <option value="portugues">Português</option>
            <option value="ciencias">Ciências</option>
            <option value="historia">História</option>
            <option value="geografia">Geografia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nível/Ano</label>
          <select className="input">
            <option value="">Selecione o nível</option>
            <option value="1-ano">1º Ano</option>
            <option value="2-ano">2º Ano</option>
            <option value="3-ano">3º Ano</option>
            <option value="4-ano">4º Ano</option>
            <option value="5-ano">5º Ano</option>
            <option value="6-ano">6º Ano</option>
            <option value="7-ano">7º Ano</option>
            <option value="8-ano">8º Ano</option>
            <option value="9-ano">9º Ano</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button className="btn-primary">
          Próximo Passo
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5-5m0 0l-5 5m5-5v12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>
```

#### Step 2: Questions with AI Integration
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto max-w-4xl">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Questions Panel -->
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Perguntas</h2>
            <button className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Pergunta
            </button>
          </div>
          
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="badge-blue">Pergunta {index + 1}</span>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option value="mcq">Múltipla Escolha</option>
                      <option value="truefalse">Verdadeiro/Falso</option>
                      <option value="short">Resposta Curta</option>
                      <option value="matching">Associação</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-ghost text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" />
                      </svg>
                    </button>
                    <button className="btn-ghost text-sm text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea className="textarea" rows={3} placeholder="Digite sua pergunta..." />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <!-- AI Assistant Panel -->
      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Assistente IA</h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Geração</label>
              <select className="input">
                <option value="questions">Gerar Perguntas</option>
                <option value="improvements">Melhorar Perguntas</option>
                <option value="examples">Adicionar Exemplos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <textarea className="textarea" rows={3} placeholder="Ex: História do Brasil, Segunda Guerra Mundial..." />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de Perguntas</label>
              <input type="number" className="input" placeholder="5" min="1" max="20" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dificuldade</label>
              <select className="input">
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
            
            <button className="btn-primary w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l7-7v-8h8l7 7-7z" />
              </svg>
              Gerar Perguntas
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## Edit Quiz Page

### Current Issues
- Similar to Create page with additional complexity
- No clear indication of edit mode
- Question management is cumbersome
- AI integration feels disconnected

### Redesign Goals
- Clear edit mode indication
- Streamlined question management
- Better AI integration workflow
- Improved mobile experience

### New Layout Structure

#### Edit Mode Header
```jsx
<header className="bg-blue-50 border-b border-blue-200 sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button className="btn-ghost">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
          </svg>
          Voltar
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Editar Quiz</h1>
            <p className="text-sm text-gray-600">{quiz.title}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
          </svg>
          Salvar Rascunho
        </button>
        <button className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Publicar
        </button>
      </div>
    </div>
  </div>
</header>
```

#### Question Management Interface
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto max-w-6xl">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Question List Sidebar -->
      <div className="lg:col-span-1">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Perguntas</h2>
            <span className="badge-blue">{questions.length}</span>
          </div>
          
          <div className="space-y-2 mb-4">
            {questions.map((question, index) => (
              <button
                key={question.id}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedQuestion === question.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedQuestion(question.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Pergunta {index + 1}</span>
                  <span className="text-xs text-gray-500">{question.type}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {question.text || 'Pergunta vazia'}
                </p>
              </button>
            ))}
          </div>
          
          <button className="btn-primary w-full">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Pergunta
          </button>
        </div>
      </div>
      
      <!-- Question Editor -->
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Editar Pergunta</h2>
            <div className="flex items-center space-x-2">
              <select className="input text-sm">
                <option value="mcq">Múltipla Escolha</option>
                <option value="truefalse">Verdadeiro/Falso</option>
                <option value="short">Resposta Curta</option>
                <option value="matching">Associação</option>
              </select>
              <button className="btn-ghost text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pergunta</label>
              <textarea className="textarea" rows={3} placeholder="Digite sua pergunta..." />
            </div>
            
            <!-- Dynamic question type content -->
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opções de Resposta</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="radio" name="answer" className="form-radio" />
                  <input type="text" className="input flex-1" placeholder="Opção A" />
                  <button className="btn-ghost text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button className="btn-ghost text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Opção
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explicação (Opcional)</label>
              <textarea className="textarea" rows={2} placeholder="Adicione uma explicação para a resposta correta..." />
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI Assistant -->
      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assistente IA</h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Online</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ação</label>
              <select className="input text-sm">
                <option value="improve">Melhorar Pergunta</option>
                <option value="alternatives">Gerar Alternativas</option>
                <option value="explanation">Criar Explicação</option>
                <option value="similar">Criar Pergunta Similar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contexto</label>
              <textarea className="textarea text-sm" rows={3} placeholder="Adicione contexto para a IA..." />
            </div>
            
            <button className="btn-primary w-full text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l7-7v-8h8l7 7-7z" />
              </svg>
              Aplicar IA
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## Quiz Taking Interface

### Current Issues
- Basic layout lacks engagement
- Timer and progress indicators are not prominent
- Navigation between questions is cumbersome
- Mobile experience needs improvement
- No visual feedback for answers

### Redesign Goals
- Create an engaging, focused quiz experience
- Improve navigation and progress tracking
- Enhance mobile responsiveness
- Add visual feedback and micro-interactions
- Optimize for different question types

### New Layout Structure

#### Quiz Header with Progress
```jsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
        <span className="badge-blue">{quiz.subject}</span>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono font-medium text-gray-700">{formatTime(timeRemaining)}</span>
        </div>
        <button className="btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
        <span>Progresso</span>
        <span>{currentQuestionIndex + 1} de {questions.length}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  </div>
</header>
```

#### Question Navigation Sidebar
```jsx
<aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-gray-700 mb-3">Navegação</h2>
    <div className="grid grid-cols-5 gap-2">
      {questions.map((question, index) => (
        <button
          key={question.id}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
            index === currentQuestionIndex
              ? 'bg-blue-500 text-white'
              : answers[question.id]
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
          onClick={() => setCurrentQuestionIndex(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  </div>
  
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-gray-700 mb-3">Estatísticas</h2>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Respondidas</span>
        <span className="font-medium">{answeredCount}/{questions.length}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tempo decorrido</span>
        <span className="font-medium">{formatTime(elapsedTime)}</span>
      </div>
    </div>
  </div>
  
  <button className="btn-primary w-full">
    Finalizar Quiz
    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
</aside>
```

#### Main Question Area
```jsx
<main className="lg:ml-64 min-h-screen bg-gray-50">
  <div className="container mx-auto px-4 py-8 max-w-4xl">
    <div className="card">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="badge-blue">Pergunta {currentQuestionIndex + 1}</span>
          <span className="text-sm text-gray-500">{questions[currentQuestionIndex].type}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {questions[currentQuestionIndex].text}
        </h2>
        {questions[currentQuestionIndex].image && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <img 
              src={questions[currentQuestionIndex].image} 
              alt="Question image" 
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
      
      <!-- Answer Options -->
      <div className="space-y-3">
        {questions[currentQuestionIndex].options.map((option, index) => (
          <label
            key={index}
            className={`block p-4 border rounded-lg cursor-pointer transition-all ${
              selectedAnswer === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="answer"
                className="form-radio"
                checked={selectedAnswer === index}
                onChange={() => setSelectedAnswer(index)}
              />
              <span className="ml-3 text-gray-900">{option}</span>
            </div>
          </label>
        ))}
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          className="btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={goToPreviousQuestion}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>
        <button
          className="btn-primary"
          onClick={currentQuestionIndex === questions.length - 1 ? finishQuiz : goToNextQuestion}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</main>
```

## Results Page

### Current Issues
- Basic presentation of results
- No detailed performance analysis
- Lacks visual engagement
- Limited options for review and sharing

### Redesign Goals
- Create an engaging results presentation
- Add detailed performance analytics
- Improve visual representation of scores
- Enhance review and sharing options

### New Layout Structure

#### Results Header
```jsx
<header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
  <div className="container mx-auto px-4 py-12 text-center">
    <div className="mb-4">
      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <h1 className="text-4xl font-bold mb-2">Parabéns!</h1>
      <p className="text-xl opacity-90">Você completou o quiz</p>
    </div>
    
    <div className="flex justify-center items-center space-x-8 mt-8">
      <div className="text-center">
        <div className="text-5xl font-bold">{score}%</div>
        <div className="text-sm opacity-75 mt-1">Pontuação</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{correctAnswers}/{totalQuestions}</div>
        <div className="text-sm opacity-75 mt-1">Acertos</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{formatTime(completionTime)}</div>
        <div className="text-sm opacity-75 mt-1">Tempo</div>
      </div>
    </div>
  </div>
</header>
```

#### Performance Analytics
```jsx
<section className="py-12 px-4">
  <div className="container mx-auto max-w-6xl">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Performance Chart -->
      <div className="lg:col-span-2">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Análise de Desempenho</h2>
          
          <!-- Score Breakdown -->
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Distribuição por Categoria</h3>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.name} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">{category.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 w-12 text-right">
                    {category.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <!-- Question Review -->
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Revisão de Perguntas</h3>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Pergunta {index + 1}</span>
                        {question.isCorrect ? (
                          <span className="badge-green">Correta</span>
                        ) : (
                          <span className="badge-red">Incorreta</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{question.text}</p>
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Sua resposta:</span>
                          <span className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {question.userAnswer}
                          </span>
                        </div>
                        {!question.isCorrect && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-gray-500">Resposta correta:</span>
                            <span className="text-green-600">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Side Panel -->
      <div className="lg:col-span-1">
        <div className="space-y-6">
          <!-- Achievement Badges -->
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conquistas</h3>
            <div className="grid grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-8 h-8 ${achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{achievement.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar Certificado
              </button>
              <button className="btn-secondary w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Compartilhar Resultado
              </button>
              <button className="btn-ghost w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## Settings Page

### Current Issues
- Basic form layout
- Lacks organization and visual hierarchy
- No clear sections for different setting types
- Mobile experience needs improvement

### Redesign Goals
- Organize settings into logical sections
- Improve visual hierarchy and navigation
- Enhance mobile responsiveness
- Add better form validation and feedback

### New Layout Structure

#### Settings Header
```jsx
<header className="bg-white border-b border-gray-200">
  <div className="container mx-auto px-4 py-6">
    <div className="flex items-center space-x-4">
      <button className="btn-ghost">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
        </svg>
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie suas preferências e conta</p>
      </div>
    </div>
  </div>
</header>
```

#### Settings Navigation
```jsx
<div className="bg-gray-50 border-b border-gray-200">
  <div className="container mx-auto px-4">
    <nav className="flex space-x-8 overflow-x-auto py-4">
      <button className={`whitespace-nowrap pb-2 border-b-2 font-medium text-sm ${
        activeTab === 'profile' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
        Perfil
      </button>
      <button className={`whitespace-nowrap pb-2 border-b-2 font-medium text-sm ${
        activeTab === 'preferences' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
        Preferências
      </button>
      <button className={`whitespace-nowrap pb-2 border-b-2 font-medium text-sm ${
        activeTab === 'ai' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
        Configurações de IA
      </button>
      <button className={`whitespace-nowrap pb-2 border-b-2 font-medium text-sm ${
        activeTab === 'export' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
        Exportação
      </button>
      <button className={`whitespace-nowrap pb-2 border-b-2 font-medium text-sm ${
        activeTab === 'account' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
        Conta
      </button>
    </nav>
  </div>
</div>
```

#### Profile Settings
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto max-w-4xl">
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações do Perfil</h2>
      
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <img 
            src={user.avatar || '/default-avatar.png'} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover"
          />
          <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
          <button className="btn-ghost text-sm mt-2">Alterar foto</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
          <input type="text" className="input" defaultValue={user.name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" className="input" defaultValue={user.email} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
          <input type="text" className="input" defaultValue={user.institution} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
          <input type="text" className="input" defaultValue={user.role} />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button className="btn-primary">Salvar Alterações</button>
      </div>
    </div>
  </div>
</section>
```

#### AI Settings
```jsx
<section className="py-8 px-4">
  <div className="container mx-auto max-w-4xl">
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações de IA</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Provedores de IA</h3>
          <div className="space-y-4">
            {aiProviders.map((provider) => (
              <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img src={provider.logo} alt={provider.name} className="w-8 h-8" />
                    <div>
                      <h4 className="font-medium text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={provider.enabled} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {provider.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chave de API</label>
                      <input type="password" className="input" placeholder="Digite sua chave de API" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                      <select className="input">
                        {provider.models.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferências de Geração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Linguagem</label>
              <select className="input">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tom</label>
              <select className="input">
                <option value="formal">Formal</option>
                <option value="casual">Informal</option>
                <option value="academic">Acadêmico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complexidade</label>
              <select className="input">
                <option value="simple">Simples</option>
                <option value="medium">Médio</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Criatividade</label>
              <input type="range" min="0" max="100" className="w-full" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button className="btn-primary">Salvar Configurações</button>
      </div>
    </div>
  </div>
</section>
```

## Mobile Responsive Considerations

### Navigation
- Collapsible sidebar with hamburger menu on mobile
- Bottom navigation bar for quiz taking
- Swipe gestures for question navigation
- Sticky headers with back buttons

### Layout Adaptations
- Single column layout for all pages on mobile
- Stacked cards instead of grids
- Full-width buttons and inputs
- Larger touch targets (minimum 44px)

### Typography
- Larger font sizes on mobile (16px base)
- Increased line height for better readability
- Bold text for better contrast
- Optimized heading hierarchy

### Interactions
- Touch-friendly controls
- Pull-to-refresh functionality
- Swipe gestures for navigation
- Haptic feedback where appropriate

## Implementation Priority

1. **Design System** - Implement the design system first
2. **Home Page** - Most visible page, establishes design language
3. **Create/Edit Quiz** - Core functionality, complex interactions
4. **Quiz Taking** - Critical user experience
5. **Results Page** - Important for user engagement
6. **Settings Page** - Lower priority, functional but less frequently used

## Accessibility Considerations

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1)
- Focus indicators
- ARIA labels and descriptions
- Semantic HTML structure
- Text alternatives for images
- Resizable text up to 200%