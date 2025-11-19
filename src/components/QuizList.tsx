import React from 'react'
import type { Quiz } from '../types'
import QuizCard from './QuizCard'

interface QuizListProps {
  quizzes: Quiz[]
  onEditQuiz: (id: string) => void
}

export const QuizList: React.FC<QuizListProps> = ({ quizzes, onEditQuiz }) => {
  if (quizzes.length === 0) {
    return null // Deixar o EmptyState lidar com o caso de lista vazia
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white transition-colors duration-200">
        Meus Quizzes ({quizzes.length})
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onEdit={onEditQuiz}
            allQuizzes={quizzes}
          />
        ))}
      </div>
    </div>
  )
}

export default QuizList