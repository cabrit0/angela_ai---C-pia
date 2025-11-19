import type { QuizResult } from '../../types'

// Função básica para exportar resultados como PDF
// Esta é uma implementação simplificada que pode ser expandida posteriormente
export function generateQuizResultPDF(result: QuizResult) {
  // Em uma implementação real, aqui seria usado o pdfmake para gerar o PDF
  // Por enquanto, vamos apenas formatar os dados para possível exportação futura
  
  const pdfData = {
    title: 'Resultado do Quiz',
    date: new Date(result.completedAt).toLocaleDateString('pt-BR'),
    score: `${result.score}/${result.totalQuestions}`,
    percentage: `${result.percentage}%`,
    performance: result.percentage >= 80 
      ? "Excelente! Você demonstrou um ótimo conhecimento no assunto."
      : result.percentage >= 60
      ? "Bom trabalho! Você acertou a maioria das questões."
      : result.percentage >= 40
      ? "Você pode melhorar. Continue estudando!"
      : "Precisa de mais prática. Não desista!"
  }
  
  console.log('Dados para PDF:', pdfData)
  return pdfData
}

export function downloadQuizResultPDF(result: QuizResult) {
  // Implementação básica - em um projeto real, isso geraria e baixaria o PDF
  const pdfData = generateQuizResultPDF(result)
  
  // Por enquanto, vamos apenas criar um arquivo JSON com os resultados
  const dataStr = JSON.stringify(pdfData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `quiz-result-${new Date().toISOString().split('T')[0]}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}