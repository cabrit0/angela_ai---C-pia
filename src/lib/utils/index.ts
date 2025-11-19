export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0
  return Math.round((score / total) * 100)
}

export function getPerformanceMessage(percentage: number): string {
  if (percentage >= 80) {
    return "Excelente! Você demonstrou um ótimo conhecimento no assunto."
  } else if (percentage >= 60) {
    return "Bom trabalho! Você acertou a maioria das questões."
  } else if (percentage >= 40) {
    return "Você pode melhorar. Continue estudando!"
  } else {
    return "Precisa de mais prática. Não desista!"
  }
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}