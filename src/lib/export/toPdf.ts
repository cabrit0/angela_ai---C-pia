import type { Quiz, Question } from '../../types/quiz'

/**
 * Exporta um único quiz para PDF com layout estruturado:
 * - Capa
 * - Texto de Apoio (se existir)
 * - Enunciado das Perguntas
 * - Secção de Soluções (gabarito) opcional no final
 *
 * Todo o conteúdo está em PT-PT.
 */
export function exportQuizToPdf(quiz: Quiz, options?: { includeAnswers?: boolean; teacherName?: string }): void {
  try {
    const includeAnswers = options?.includeAnswers ?? true
    const teacherName = options?.teacherName || ''
    const docDefinition = generateSingleQuizDocDefinition(quiz, { includeAnswers, teacherName })

    createAndDownloadPdf(docDefinition, quiz.title)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw new Error('Não foi possível gerar o PDF. Tente novamente.')
  }
}

/**
 * Exporta múltiplos quizzes para PDF com:
 * - Página inicial de sumário
 * - Cada quiz em nova página com mini-capa, texto de apoio e enunciado
 * - Secção final de soluções agregadas (configurável)
 */
export function exportMultipleQuizzesToPdf(
  quizzes: Quiz[],
  options?: { includeAnswers?: boolean; teacherName?: string }
): void {
  try {
    if (quizzes.length === 0) {
      throw new Error('Nenhum quiz para exportar')
    }

    const includeAnswers = options?.includeAnswers ?? true
    const teacherName = options?.teacherName || ''
    const docDefinition = generateMultipleQuizzesDocDefinition(quizzes, { includeAnswers, teacherName })

    createAndDownloadPdf(docDefinition, 'todos_quizzes')
  } catch (error) {
    console.error('Erro ao gerar PDF em lote:', error)
    throw new Error('Não foi possível gerar o PDF em lote. Tente novamente.')
  }
}

// ===== Construção do PDF para um único quiz =====

interface PdfOptions {
  includeAnswers: boolean
  teacherName?: string
}

// Gera o docDefinition para um único quiz
function generateSingleQuizDocDefinition(quiz: Quiz, options: PdfOptions) {
  const content: any[] = []
  const defaultMargin = [20, 20, 20, 20] // margens reduzidas para melhor aproveitamento da página

  // Capa (página exclusiva)
  content.push(...buildCoverPage(quiz, options.teacherName))

  // Texto de Apoio (se existir) - página exclusiva
  if (quiz.supportText && quiz.supportText.trim().length > 0) {
    content.push(...buildSupportTextSection(quiz.supportText, true))
  }

  // Enunciado das Perguntas
  content.push(...buildQuestionsSection(quiz))

  // Secção de Soluções (Gabarito) opcional
  if (options.includeAnswers) {
    content.push(...buildAnswersSectionForSingleQuiz(quiz))
  }

  return {
    pageMargins: defaultMargin,
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.4
    },
    styles: {
      coverTitle: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 8]
      },
      coverSubTitle: {
        fontSize: 13,
        italics: true,
        alignment: 'center',
        margin: [0, 0, 0, 4]
      },
      coverMeta: {
        fontSize: 12,
        alignment: 'center',
        margin: [0, 2, 0, 2]
      },
      sectionTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 16, 0, 6],
        decoration: 'underline'
      },
      supportText: {
        fontSize: 11,
        lineHeight: 1.6,
        margin: [0, 0, 0, 8],
        alignment: 'justify'
      },
      questionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 8, 0, 2]
      },
      questionPrompt: {
        fontSize: 11,
        margin: [0, 0, 0, 3]
      },
      optionText: {
        fontSize: 11,
        margin: [12, 1, 0, 1]
      },
      answerLine: {
        fontSize: 11,
        margin: [0, 3, 0, 0]
      },
      answersTitle: {
        fontSize: 15,
        bold: true,
        margin: [0, 16, 0, 6],
        decoration: 'underline'
      },
      answerEntry: {
        fontSize: 11,
        margin: [0, 2, 0, 2]
      }
    },
    content
  }
}

// Constrói a capa de um quiz
function buildCoverPage(quiz: Quiz, teacherName?: string): any[] {
  const createdDate = quiz.createdAt
    ? new Date(quiz.createdAt).toLocaleDateString('pt-PT')
    : ''

  const metaParts: string[] = []
  if (teacherName) metaParts.push(`Professor(a): ${teacherName}`)
  if (quiz.subject) metaParts.push(`Disciplina: ${quiz.subject}`)
  if (quiz.grade) metaParts.push(`Nível/Ano: ${quiz.grade}`)
  if (createdDate) metaParts.push(`Data de criação: ${createdDate}`)

  // Garantir que a capa fica sozinha e o resto inicia na página seguinte
  return [
    {
      text: quiz.title || 'Quiz',
      style: 'coverTitle'
    },
    ...(metaParts.length
      ? [
          {
            text: metaParts.join('   •   '),
            style: 'coverMeta'
          }
        ]
      : []),
    {
      text: 'Enunciado para impressão e utilização em sala de aula.',
      style: 'coverSubTitle'
    },
    {
      text: '',
      pageBreak: 'after'
    }
  ]
}

// Secção "Texto de Apoio" - layout otimizado para aproveitamento da página
function buildSupportTextSection(supportText: string, exclusivePage: boolean = false): any[] {
  const content = [
    {
      text: 'Texto de Apoio',
      style: 'sectionTitle',
      ...(exclusivePage && { pageBreak: 'before' })
    },
    {
      text: supportText,
      fontSize: 11,
      lineHeight: 1.6,
      margin: [0, 0, 0, 8],
      alignment: 'justify'
    }
  ]

  if (exclusivePage) {
    content.push({
      text: '',
      pageBreak: 'after'
    } as any)
  } else {
    content.push({
      text: '',
      fontSize: 11,
      lineHeight: 1.4,
      margin: [0, 4, 0, 0],
      alignment: 'left'
    })
  }

  return content
}

// Secção "Enunciado das Perguntas"
function buildQuestionsSection(quiz: Quiz): any[] {
  const blocks: any[] = []

  blocks.push({
    text: 'Enunciado das Perguntas',
    style: 'sectionTitle'
  })

  // Pequenas instruções gerais
  blocks.push({
    text: 'Responda a todas as questões abaixo. Leia atentamente cada enunciado antes de responder.',
    fontSize: 10,
    margin: [0, 0, 0, 8]
  })

  quiz.questions.forEach((question, index) => {
    blocks.push(...buildQuestionBlock(question, index + 1))
  })

  return blocks
}

// Bloco de uma pergunta (enunciado somente)
function buildQuestionBlock(question: Question, number: number): any[] {
  const qBlocks: any[] = []

  // Cabeçalho da pergunta
  qBlocks.push({
    text: `Pergunta ${number}`,
    style: 'questionHeader'
  })

  qBlocks.push({
    text: question.prompt,
    style: 'questionPrompt'
  })

  // Imagens removidas do PDF para otimizar layout e uso da página
  // As imagens não são renderizadas para economizar espaço e garantir
  // que o conteúdo textual aproveite melhor a folha
  // if (question.imageUrl) {
  //   qBlocks.push({
  //     text: `[Imagem associada à questão: ${question.imageUrl}]`,
  //     fontSize: 8,
  //     italics: true,
  //     margin: [0, 0, 0, 4],
  //     color: '#555555'
  //   })
  // }

  // Conteúdo específico por tipo
  switch (question.type) {
    case 'mcq': {
      // Escolha múltipla: opções em letras A, B, C...
      if (question.choices && question.choices.length > 0) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        question.choices.forEach((choice, idx) => {
          qBlocks.push({
            text: `${letters[idx] || '-'} ) ${choice.text}`,
            style: 'optionText'
          })
        })
      }
      break
    }

    case 'truefalse': {
      // Verdadeiro/Falso
      qBlocks.push({
        text: 'Verdadeiro (  )    Falso (  )',
        style: 'optionText'
      })
      break
    }

    case 'short':
    case 'gapfill': {
      // Resposta curta / lacuna: linhas para resposta ocupando largura útil
      qBlocks.push({
        text: 'Resposta: _________________________________________________________________________________',
        style: 'answerLine'
      })
      break
    }

    case 'essay': {
      // Desenvolvimento: várias linhas com melhor aproveitamento da largura útil
      for (let i = 0; i < 6; i++) {
        qBlocks.push({
          text: '____________________________________________________________________________________________________',
          style: 'answerLine'
        })
      }
      break
    }

    case 'matching': {
      // Associação
      if (question.matchingPairs && question.matchingPairs.length > 0) {
        qBlocks.push({
          text: 'Associe os itens da coluna da esquerda à coluna da direita:',
          style: 'optionText',
          margin: [0, 2, 0, 2]
        })

        question.matchingPairs.forEach((pair, idx) => {
          qBlocks.push({
            text: `${idx + 1}. ${pair.leftItem}  ____________`,
            style: 'optionText'
          })
        })
      }
      break
    }

    case 'ordering': {
      // Ordenação
      if (question.orderingItems && question.orderingItems.length > 0) {
        qBlocks.push({
          text: 'Organize os itens pela ordem correta (numere de 1 a n):',
          style: 'optionText',
          margin: [0, 2, 0, 2]
        })

        question.orderingItems.forEach((item, idx) => {
          qBlocks.push({
            text: `${idx + 1}. ${item}`,
            style: 'optionText'
          })
        })
      }
      break
    }
  }

  // Espaço otimizado após cada pergunta para melhor aproveitamento da página
  qBlocks.push({
    text: '',
    margin: [0, 4, 0, 2]
  })

  return qBlocks
}

// Secção de respostas para um único quiz
function buildAnswersSectionForSingleQuiz(quiz: Quiz): any[] {
  const blocks: any[] = []

  // Forçar início da secção numa nova página para impressão clara
  blocks.push({
    text: 'Soluções (Gabarito)',
    style: 'answersTitle',
    pageBreak: 'before'
  })

  quiz.questions.forEach((question, index) => {
    const answerText = getAnswerSummary(question)
    blocks.push({
      text: `Pergunta ${index + 1}: ${answerText}`,
      style: 'answerEntry'
    })
  })

  return blocks
}

// ===== Construção do PDF para múltiplos quizzes =====

function generateMultipleQuizzesDocDefinition(quizzes: Quiz[], options: PdfOptions) {
  const content: any[] = []
  const defaultMargin = [20, 20, 20, 20] // margens reduzidas para melhor aproveitamento

  // Página de sumário
  content.push({
    text: 'Conjunto de Quizzes',
    style: 'coverTitle'
  })

  if (options.teacherName) {
    content.push({
      text: `Professor(a): ${options.teacherName}`,
      style: 'coverMeta'
    })
  }

  content.push({
    text: `Total de quizzes: ${quizzes.length}`,
    style: 'coverMeta'
  })

  content.push({
    text: 'Resumo dos quizzes incluídos:',
    fontSize: 11,
    margin: [0, 10, 0, 6]
  })

  quizzes.forEach((quiz, index) => {
    const createdDate = quiz.createdAt
      ? new Date(quiz.createdAt).toLocaleDateString('pt-PT')
      : ''
    const metaParts: string[] = []
    if (quiz.subject) metaParts.push(`Disciplina: ${quiz.subject}`)
    if (quiz.grade) metaParts.push(`Nível/Ano: ${quiz.grade}`)
    if (createdDate) metaParts.push(`Data: ${createdDate}`)

    content.push({
      text: `${index + 1}. ${quiz.title || 'Quiz sem título'}`,
      fontSize: 11,
      bold: true,
      margin: [0, 2, 0, 0]
    })

    if (metaParts.length) {
      content.push({
        text: metaParts.join('   •   '),
        fontSize: 9,
        margin: [10, 0, 0, 2],
        color: '#555555'
      })
    }
  })

  content.push({
    text: '',
    pageBreak: 'after'
  })

  // Cada quiz em nova página
  quizzes.forEach((quiz, idx) => {
    if (idx > 0) {
      content.push({
        text: '',
        pageBreak: 'before'
      })
    }

    // Mini-capa/local header
    const createdDate = quiz.createdAt
      ? new Date(quiz.createdAt).toLocaleDateString('pt-PT')
      : ''

    const meta: string[] = []
    if (options.teacherName) meta.push(`Professor(a): ${options.teacherName}`)
    if (quiz.subject) meta.push(`Disciplina: ${quiz.subject}`)
    if (quiz.grade) meta.push(`Nível/Ano: ${quiz.grade}`)
    if (createdDate) meta.push(`Data de criação: ${createdDate}`)

    content.push({
      text: quiz.title || `Quiz ${idx + 1}`,
      fontSize: 18,
      bold: true,
      margin: [0, 0, 0, 3]
    })

    if (meta.length) {
      content.push({
        text: meta.join('   •   '),
        fontSize: 10,
        margin: [0, 0, 0, 6],
        color: '#555555'
      })
    }

    // Texto de apoio local - sempre incluído se existir (página exclusiva)
    if (quiz.supportText && quiz.supportText.trim().length > 0) {
      content.push(...buildSupportTextSection(quiz.supportText, true))
    }

    // Enunciado das perguntas
    content.push(...buildQuestionsSection(quiz))
  })

  // Secção final de soluções agregadas (se incluída)
  if (options.includeAnswers) {
    content.push({
      text: 'Soluções (Gabarito) - Todos os Quizzes',
      style: 'answersTitle',
      pageBreak: 'before'
    })

    quizzes.forEach((quiz, quizIndex) => {
      content.push({
        text: `${quizIndex + 1}. ${quiz.title || 'Quiz sem título'}`,
        fontSize: 11,
        bold: true,
        margin: [0, 6, 0, 2]
      })

      quiz.questions.forEach((question, qIndex) => {
        const answerText = getAnswerSummary(question)
        content.push({
          text: `  Pergunta ${qIndex + 1}: ${answerText}`,
          style: 'answerEntry'
        })
      })
    })
  }

  return {
    pageMargins: defaultMargin,
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.4
    },
    styles: {
      coverTitle: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 8]
      },
      coverSubTitle: {
        fontSize: 13,
        italics: true,
        alignment: 'center',
        margin: [0, 0, 0, 4]
      },
      coverMeta: {
        fontSize: 12,
        alignment: 'center',
        margin: [0, 2, 0, 2]
      },
      sectionTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 16, 0, 6],
        decoration: 'underline'
      },
      supportText: {
        fontSize: 11,
        lineHeight: 1.6,
        margin: [0, 0, 0, 8],
        alignment: 'justify'
      },
      questionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 8, 0, 2]
      },
      questionPrompt: {
        fontSize: 11,
        margin: [0, 0, 0, 3]
      },
      optionText: {
        fontSize: 11,
        margin: [12, 1, 0, 1]
      },
      answerLine: {
        fontSize: 11,
        margin: [0, 3, 0, 0]
      },
      answersTitle: {
        fontSize: 15,
        bold: true,
        margin: [0, 16, 0, 6],
        decoration: 'underline'
      },
      answerEntry: {
        fontSize: 11,
        margin: [0, 2, 0, 2]
      }
    },
    content
  }
}

// ===== Utilitários de respostas =====

// Devolve uma descrição textual da solução de uma questão,
// em PT-PT, para utilização no gabarito.
function getAnswerSummary(question: Question): string {
  switch (question.type) {
    case 'mcq': {
      if (!question.choices || question.choices.length === 0) return 'Sem opções definidas.'
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const correctLetters = question.choices
        .map((choice, idx) => (choice.correct ? letters[idx] : null))
        .filter(Boolean)

      if (correctLetters.length === 0) {
        return 'Sem opção correta assinalada.'
      }

      return `Opção(ões) correta(s): ${correctLetters.join(', ')}.`
    }

    case 'truefalse': {
      if (!question.choices || question.choices.length === 0) {
        return 'Sem opções definidas.'
      }
      const correct = question.choices.find((c) => c.correct)
      if (!correct) return 'Sem resposta correta assinalada.'
      return `Resposta correta: ${correct.text}.`
    }

    case 'short':
    case 'gapfill': {
      if (!question.answer) return 'Resposta de referência não definida.'
      return `Resposta de referência: ${question.answer}.`
    }

    case 'essay': {
      if (!question.answer) {
        return 'Resposta de desenvolvimento sugerida não definida.'
      }
      return `Orientação de correção: ${question.answer}.`
    }

    case 'matching': {
      if (!question.matchingPairs || question.matchingPairs.length === 0) {
        return 'Pares de associação não definidos.'
      }
      const pairs = question.matchingPairs
        .map((p, idx) => `${idx + 1}) ${p.leftItem} -> ${p.rightItem}`)
        .join(' | ')
      return `Associações corretas: ${pairs}.`
    }

    case 'ordering': {
      if (!question.orderingItems || question.orderingItems.length === 0) {
        return 'Itens para ordenação não definidos.'
      }
      const order = question.orderingItems.map((item, idx) => `${idx + 1}) ${item}`).join(' | ')
      return `Ordem correta sugerida: ${order}.`
    }

    default:
      return 'Tipo de questão desconhecido.'
  }
}

// ===== Criação e download do PDF usando pdfmake =====

/**
 * Cria e descarrega o PDF a partir de um docDefinition pdfmake.
 * Mantém a lógica dinâmica existente, mas com mensagens em PT-PT.
 */
function createAndDownloadPdf(docDefinition: any, baseTitle: string) {
  import('pdfmake')
    .then((pdfMakeModule) => {
      return import('pdfmake/build/vfs_fonts')
        .then((fonts) => {
          const pdfMake = (pdfMakeModule as any).default || (pdfMakeModule as any)

          // Configuração robusta do VFS, compatível com diferentes versões
          if (fonts && (fonts as any).default) {
            pdfMake.vfs = (fonts as any).default
          } else if ((fonts as any).pdfMake && (fonts as any).pdfMake.vfs) {
            pdfMake.vfs = (fonts as any).pdfMake.vfs
          } else {
            pdfMake.vfs = fonts as any
          }

          if (!pdfMake.vfs || Object.keys(pdfMake.vfs).length === 0) {
            console.error('VFS não foi configurado corretamente', pdfMake.vfs)
            throw new Error('Não foi possível configurar as fontes do PDF.')
          }

          const safeTitle =
            (baseTitle || 'quiz')
              .toString()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/gi, '_')
              .toLowerCase() || 'quiz'

          const pdfDoc = pdfMake.createPdf(docDefinition)
          const fileName = `${safeTitle}.pdf`

          pdfDoc.download(fileName)
        })
        .catch((error: unknown) => {
          console.error('Erro ao carregar fontes do pdfmake:', error)
          throw new Error('Não foi possível carregar as fontes do PDF.')
        })
    })
    .catch((error: unknown) => {
      console.error('Erro ao carregar pdfmake:', error)
      throw new Error('Não foi possível carregar a biblioteca de PDF.')
    })
}
