import type { QType } from '../../types';

// Templates de prompt para diferentes tipos de perguntas
export interface PromptTemplate {
  topic: string;
  grade?: string;
  questionType: QType;
  count: number;
  language?: string;
}

// Template base para geração de perguntas
export function generateBasePrompt(template: PromptTemplate): string {
  const { topic, grade, questionType, count, language = 'português' } = template;
  
  const questionTypeText = {
    mcq: 'múltipla escolha com 4 opções',
    truefalse: 'verdadeiro ou falso',
    short: 'resposta curta',
    gapfill: 'preencher lacunas em frases com espaço em branco',
    essay: 'resposta discursiva (2-3 frases explicativas)',
    matching: 'associação (coluna esquerda com coluna direita)',
    ordering: 'ordenação sequencial completa (organizar itens do primeiro ao último e indicar a ordem correta)'
  }[questionType];

  const gradeText = grade ? ` para alunos de ${grade}` : '';
  
  return `Gere ${count} perguntas de ${questionTypeText} sobre o tema "${topic}"${gradeText} em ${language}. 

Para cada pergunta, siga este formato JSON:
{
  "questions": [
    {
      "prompt": "texto da pergunta",
      "choices": ["opção A", "opção B", "opção C", "opção D"],
      "correctAnswer": 0,
      "explanation": "explicação breve da resposta correta"
    }
  ]
}

Para perguntas de verdadeiro/falso:
{
  "questions": [
    {
      "prompt": "texto da afirmação",
      "correctAnswer": true,
      "explanation": "explicação breve"
    }
  ]
}

Para perguntas de resposta curta:
{
  "questions": [
    {
      "prompt": "texto da pergunta",
      "answer": "resposta correta",
      "explanation": "explicação breve"
    }
  ]
}

Para perguntas de preencher lacunas:
{
  "questions": [
    {
      "prompt": "Frase com ___ lacuna para o aluno completar",
      "answer": "palavra ou expressão correta",
      "explanation": "explicação breve do porquê esta palavra completa a frase"
    }
  ]
}

Para perguntas discursivas:
{
  "questions": [
    {
      "prompt": "texto da pergunta aberta",
      "answer": "resposta modelo com 2-3 frases",
      "explanation": "critério principal de correção"
    }
  ]
}

Para perguntas de associação:
{
  "questions": [
    {
      "prompt": "texto da pergunta",
      "matchingPairs": [
        {"leftItem": "item da esquerda 1", "rightItem": "item da direita 1"},
        {"leftItem": "item da esquerda 2", "rightItem": "item da direita 2"}
      ],
      "explanation": "explicação breve"
    }
  ]
}

Para perguntas de ordenação:
{
  "questions": [
    {
      "prompt": "texto da pergunta",
      "orderingItems": ["passo 1", "passo 2", "passo 3"],
      "answer": "passo 1 -> passo 2 -> passo 3",
      "explanation": "explicação breve"
    }
  ]
}

Importante:
- As perguntas devem ser claras e objetivas
- Para múltipla escolha, apenas uma resposta deve estar correta
- Inclua explicações educativas para cada resposta
- Retorne APENAS o JSON válido, sem texto adicional`;
}

// Template específico para Pollinations (mais simples)
export function generatePollinationsPrompt(template: PromptTemplate): string {
  const { topic, grade, questionType, count, language = 'português' } = template;
  
  const questionTypeText = {
    mcq: 'múltipla escolha com 4 opções',
    truefalse: 'verdadeiro ou falso',
    short: 'resposta curta',
    gapfill: 'frases com lacunas para preencher',
    essay: 'resposta discursiva de 2-3 frases',
    matching: 'associação (colunas)',
    ordering: 'ordenação (sequência cronológica ou lógica com resposta final)'
  }[questionType];

  const gradeText = grade ? ` para alunos de ${grade}` : '';
  
  const formatExamples: Record<QType, string> = {
    mcq: 'Pergunta: [texto]\nA) [opção]\nB) [opção]\nC) [opção]\nD) [opção]\nResposta: [letra correta]',
    truefalse: 'Afirmação: [texto]\nResposta: [Verdadeiro/Falso]\nExplicação: [motivo em 1 frase]',
    short: 'Pergunta: [texto]\nResposta: [resposta curta]\nExplicação: [motivo em 1 frase]',
    gapfill: 'Frase incompleta: [texto com ___]\nResposta: [palavra ou expressão que completa a lacuna]\nExplicação: [porque esta palavra é correta]',
    essay: 'Pergunta aberta: [texto]\nResposta modelo: [resposta com 2-3 frases]\nCritério: [principal ponto que deve aparecer]',
    matching: 'Pergunta: [texto]\nEsquerda: [item1], [item2], [item3]\nDireita: [itemA], [itemB], [itemC]\nRespostas: [1-A], [2-B], [3-C]',
    ordering: 'Pergunta: [texto]\nPassos: [item 1] > [item 2] > [item 3]\nResposta: [item 1 -> item 2 -> item 3]'
  };

  return `Crie ${count} perguntas de ${questionTypeText} sobre "${topic}"${gradeText} em ${language}.

Responda no seguinte formato:
${formatExamples[questionType] || formatExamples.mcq}

Separe cada pergunta com uma linha em branco.`;
}

// Template específico para Hugging Face (mais estruturado)
export function generateHuggingFacePrompt(template: PromptTemplate): string {
  const { topic, grade, questionType, count, language = 'português' } = template;
  
  const questionTypeText = {
    mcq: 'múltipla escolha',
    truefalse: 'verdadeiro ou falso',
    short: 'resposta curta',
    gapfill: 'preencher lacunas',
    essay: 'resposta discursiva',
    matching: 'associação',
    ordering: 'ordenação sequencial'
  }[questionType];

  const gradeText = grade ? ` para nível ${grade}` : '';
  
  const jsonExamples: Record<QType, string> = {
    mcq: '{"prompt": "texto", "choices": ["A", "B", "C", "D"], "correct": 0, "explanation": "explicação"}',
    truefalse: '{"prompt": "afirmação", "correct": true, "explanation": "explicação"}',
    short: '{"prompt": "pergunta", "answer": "resposta curta", "explanation": "explicação"}',
    gapfill: '{"prompt": "Frase com ___ lacuna", "answer": "palavra correta", "explanation": "motivo da escolha"}',
    essay: '{"prompt": "pergunta aberta", "answer": "resposta modelo com 2-3 frases", "explanation": "critérios principais"}',
    matching: '{"prompt": "pergunta", "matchingPairs": [{"leftItem": "esquerda1", "rightItem": "direita1"}, {"leftItem": "esquerda2", "rightItem": "direita2"}], "explanation": "explicação"}',
    ordering: '{"prompt": "pergunta", "orderingItems": ["passo 1", "passo 2", "passo 3"], "answer": "passo 1 -> passo 2 -> passo 3", "explanation": "explicação"}'
  };

  return `<s>[INST] Você é um professor experiente que cria perguntas educativas de alta qualidade.

Crie ${count} perguntas de ${questionTypeText} sobre o tema "${topic}"${gradeText} em ${language}.

Instruções:
- As perguntas devem ser adequadas para o nível especificado
- Sejam claras, objetivas e educativamente valiosas
- Para múltipla escolha: 4 opções com apenas uma correta
- Inclua explicações breves para as respostas

Formato de saída JSON:
{
  "questions": [
    ${jsonExamples[questionType] || jsonExamples.mcq}
  ]
}

Retorne APENAS o JSON válido. [/INST]</s>`;
}

// Função para parsear respostas da API para o formato Question
export function parseApiResponse(response: string, questionType: QType): any[] {
  // Silently handle parsing errors - users shouldn't see technical errors
  try {
    // Limpar a resposta de caracteres inválidos
    let cleaned = response.trim();
    
    // Remover caracteres de controle inválidos que causam erro de parse
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Tentar encontrar um objeto JSON válido na resposta
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[0];
        const parsed = safeJsonParse(jsonStr);
        if (parsed && parsed.questions) {
          return parsed.questions;
        }
      } catch (jsonError) {
        // Silently try different cleaning strategies without showing errors to users
        // Tentar com diferentes estratégias de limpeza
        const cleaningStrategies = [
          // Estratégia 1: Limpeza básica
          (str: string) => str.replace(/^[^{]*/, '').replace(/[^}]*$/, ''),
          // Estratégia 2: Corrigir aspas escapadas incorretamente
          (str: string) => fixEscapedCharacters(str),
          // Estratégia 3: Limpeza agressiva de caracteres problemáticos
          (str: string) => aggressiveClean(str),
          // Estratégia 4: Tentar extrair JSON de markdown
          (str: string) => extractJsonFromMarkdown(str)
        ];
        
        for (const strategy of cleaningStrategies) {
          try {
            let cleanedJson = strategy(jsonMatch[0]);
            const parsed = safeJsonParse(cleanedJson);
            if (parsed && parsed.questions) {
              return parsed.questions;
            }
          } catch (strategyError) {
            // Silently continue to next strategy
            continue;
          }
        }
      }
    }
    
    // Se não for JSON, tentar parse de texto simples como fallback silencioso
    return parseTextResponse(response, questionType);
  } catch (error) {
    // Silently return empty array on any error - users shouldn't see technical errors
    return [];
  }
}

// Função para fazer parse seguro de JSON com tratamento de erros silencioso
function safeJsonParse(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    // Tentar corrigir problemas comuns de formatação JSON
    let fixedStr = jsonStr;
    
    // Corrigir aspas escapadas incorretamente
    fixedStr = fixEscapedCharacters(fixedStr);
    
    // Tentar fazer parse novamente
    try {
      return JSON.parse(fixedStr);
    } catch (secondError) {
      // Se ainda falhar, tentar uma abordagem mais agressiva
      fixedStr = aggressiveClean(fixedStr);
      try {
        return JSON.parse(fixedStr);
      } catch (thirdError) {
        // Silently return null instead of throwing error
        return null;
      }
    }
  }
}

// Função para corrigir caracteres escapados incorretamente
function fixEscapedCharacters(str: string): string {
  // Preservar escapes válidos mas corrigir inválidos
  return str
    // Corrigir aspas duplas escapadas incorretamente - handle multiple escape levels
    .replace(/\\\\+"/g, '\\"') // Fix double-escaped quotes
    .replace(/\\([^"\\\/bfnrt])/g, '$1') // Remove escapes inválidos
    .replace(/\\"/g, '"') // Corrige aspas duplas escapadas
    .replace(/\\'/g, "'") // Corrige aspas simples escapadas
    // Corrigir newlines e outros caracteres de controle
    .replace(/\\n/g, '\n') // Actual newlines instead of literal \n
    .replace(/\\r/g, '\r') // Actual carriage returns
    .replace(/\\t/g, '\t') // Actual tabs
    // Fix common JSON formatting issues
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
    // Fix unquoted property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
}

// Função para limpeza agressiva de JSON malformado
function aggressiveClean(str: string): string {
  return str
    // Remover texto antes do primeiro {
    .replace(/^[^{]*\{/, '{')
    // Remover texto depois do último }
    .replace(/\}[^}]*$/, '}')
    // Corrigir propriedades sem aspas
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Corrigir valores de string sem aspas
    .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s\-_.,!?]*)\s*([,}])/g, ': "$1"$2')
    // Remover vírgulas finais
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Fix escaped newlines and quotes in strings
    .replace(/\\n/g, '\\n')
    .replace(/\\r/g, '\\r')
    .replace(/\\t/g, '\\t')
    .replace(/\\"/g, '\\"');
}

// Função para extrair JSON de blocos de código markdown
function extractJsonFromMarkdown(str: string): string {
  // Tentar encontrar JSON em blocos de código
  const codeBlockMatch = str.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  
  // Tentar encontrar JSON entre aspas backticks
  const backtickMatch = str.match(/`(\{[\s\S]*?\})`/);
  if (backtickMatch) {
    return backtickMatch[1];
  }
  
  return str;
}

// Função para parsear respostas em texto simples (especialmente para Pollinations)
function parseTextResponse(response: string, questionType: QType): any[] {
  const questions: any[] = [];
  const sections = response.split(/\n\s*\n/).filter(s => s.trim());
  
  for (const section of sections) {
    try {
      if (questionType === 'mcq') {
        const lines = section.split('\n').filter(l => l.trim());
        const promptLine = lines.find(l => l.startsWith('Pergunta:'));
        const options = lines.filter(l => /^[A-D]\)/.test(l));
        const answerLine = lines.find(l => l.startsWith('Resposta:'));
        
        if (promptLine && options.length === 4 && answerLine) {
          const prompt = promptLine.replace('Pergunta:', '').trim();
          const choices = options.map(opt => opt.replace(/^[A-D]\)\s*/, '').trim());
          const correctLetter = answerLine.replace('Resposta:', '').trim().toUpperCase();
          const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
          
          if (correctIndex >= 0) {
            questions.push({
              prompt,
              choices,
              correct: correctIndex,
              explanation: ''
            });
          }
        }
      } else if (questionType === 'truefalse') {
        const lines = section.split('\n').filter(l => l.trim());
        const statementLine = lines.find(l => l.startsWith('Afirmação:'));
        const answerLine = lines.find(l => l.startsWith('Resposta:'));
        
        if (statementLine && answerLine) {
          const prompt = statementLine.replace('Afirmação:', '').trim();
          const answerText = answerLine.replace('Resposta:', '').trim().toLowerCase();
          const correct = answerText.includes('verdade') || answerText === 'v';
          
          questions.push({
            prompt,
            correct,
            explanation: ''
          });
        }
      } else if (questionType === 'short' || questionType === 'gapfill' || questionType === 'essay') {
        const lines = section.split('\n').filter(l => l.trim());
        const questionLine = lines.find(l =>
          l.startsWith('Pergunta:') ||
          l.startsWith('Frase:') ||
          l.startsWith('Frase incompleta:')
        );
        const answerLine = lines.find(l =>
          l.startsWith('Resposta:') ||
          l.startsWith('Resposta modelo:') ||
          l.startsWith('Preenchimento:') ||
          l.startsWith('Completa:')
        );
        
        if (questionLine && answerLine) {
          const prompt = questionLine.replace(/^Pergunta:|^Frase incompleta:|^Frase:/i, '').trim();
          const answer = answerLine.replace(/^Resposta(?:\s+modelo)?:|^Preenchimento:|^Completa:/i, '').trim();
          
          questions.push({
            prompt,
            answer,
            explanation: ''
          });
        }
      } else if (questionType === 'matching') {
        const lines = section.split('\n').filter(l => l.trim());
        const questionLine = lines.find(l => l.startsWith('Pergunta:'));
        const leftLine = lines.find(l => l.startsWith('Esquerda:'));
        const rightLine = lines.find(l => l.startsWith('Direita:'));
        const answersLine = lines.find(l => l.startsWith('Respostas:'));
        
        if (questionLine && leftLine && rightLine && answersLine) {
          const prompt = questionLine.replace('Pergunta:', '').trim();
          const leftItems = leftLine.replace('Esquerda:', '').trim().split(',').map(item => item.trim());
          const rightItems = rightLine.replace('Direita:', '').trim().split(',').map(item => item.trim());
          const answers = answersLine.replace('Respostas:', '').trim().split(',').map(item => item.trim());
          
          const matchingPairs = answers.map(answer => {
            const [leftIndex, rightIndex] = answer.split('-').map(index => {
              const match = index.match(/\d+/);
              return match ? parseInt(match[0]) - 1 : 0;
            });
            
            return {
              leftItem: leftItems[leftIndex] || '',
              rightItem: rightItems[rightIndex] || ''
            };
          }).filter(pair => pair.leftItem && pair.rightItem);
          
          if (matchingPairs.length > 0) {
            questions.push({
              prompt,
              matchingPairs,
              explanation: ''
            });
          }
        }
      } else if (questionType === 'ordering') {
        const lines = section.split('\n').filter(l => l.trim());
        const questionLine = lines.find(l => l.startsWith('Pergunta:'));
        const orderLine = lines.find(l =>
          l.toLowerCase().startsWith('ordem:') ||
          l.toLowerCase().startsWith('sequência:') ||
          l.toLowerCase().startsWith('sequencia:')
        );
        
        if (questionLine && orderLine) {
          const prompt = questionLine.replace('Pergunta:', '').trim();
          const itemsText = orderLine.replace(/^[^:]+:/, '').trim();
          const orderingItems = itemsText
            .split(/>|->|\u2192|\u2794|,|;/)
            .map(item => item.replace(/^\d+[\).]?\s*/, '').trim())
            .filter(Boolean);
          
          if (orderingItems.length >= 3) {
            questions.push({
              prompt,
              orderingItems,
              explanation: ''
            });
          }
        }
      }
    } catch (error) {
      // Silently ignore parsing errors in individual sections
      continue;
    }
  }
  
  return questions;
}
