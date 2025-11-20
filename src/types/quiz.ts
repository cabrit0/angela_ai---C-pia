// src/types/quiz.ts
export type QType =
  | 'mcq'
  | 'truefalse'
  | 'short'
  | 'matching'
  | 'ordering'
  | 'gapfill'
  | 'essay'

export interface Choice {
  id: string
  text: string
  correct?: boolean
}

export interface MatchingPair {
  id: string
  leftItem: string
  rightItem: string
}

export interface Question {
  id: string
  type: QType
  prompt: string
  imageUrl?: string
  choices?: Choice[]
  answer?: string
  matchingPairs?: MatchingPair[]
  orderingItems?: string[]
}

export interface Quiz {
  id: string
  title: string
  subject?: string
  grade?: string
  questions: Question[]
  questionCount?: number
  createdAt: number
  updatedAt: number
  isPublished?: boolean
  supportText?: string
  youtubeVideos?: string[]
  isLocallySaved?: boolean // Flag to indicate if quiz is saved locally only
}
