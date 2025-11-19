import { setupServer } from 'msw/node'
import { http } from 'msw'

// Mock data
const mockQuizzes = [
  {
    id: 'quiz1',
    title: 'Quiz de Matemática',
    subject: 'Matemática',
    grade: '7º Ano',
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        prompt: 'Quanto é 2 + 2?',
        choices: [
          { id: 'a', text: '3', correct: false },
          { id: 'b', text: '4', correct: true },
          { id: 'c', text: '5', correct: false }
        ]
      }
    ],
    createdAt: '2023-01-01T00:00:00Z'
  }
]

const mockClasses = [
  {
    id: 'class1',
    name: 'Turma 7ºA',
    description: 'Turma do 7º ano A',
    teacherId: 'teacher1'
  }
]

const mockAssignments = [
  {
    id: 'assignment1',
    quizId: 'quiz1',
    classId: 'class1',
    isActive: true,
    availableFrom: '2023-01-01T00:00:00Z',
    availableTo: '2023-12-31T23:59:59Z'
  }
]

const mockQuizStatistics = {
  quizId: 'quiz1',
  totalAttempts: 25,
  averageScore: 75.5,
  passRate: 80.0,
  averageTimeMinutes: 15,
  questionStatistics: [
    {
      questionId: 'q1',
      prompt: 'Quanto é 2 + 2?',
      correctAnswers: 20,
      incorrectAnswers: 5,
      correctRate: 80.0
    }
  ]
}

const mockClassStatistics = {
  classId: 'class1',
  totalStudents: 30,
  averageScore: 72.3,
  activeStudents: 25,
  topPerformers: [
    {
      studentId: 'student1',
      name: 'João Silva',
      averageScore: 95.0,
      totalAttempts: 5
    }
  ]
}

const mockStudentAttempts = [
  {
    id: 'attempt1',
    quizId: 'quiz1',
    quizTitle: 'Quiz de Matemática',
    studentId: 'student1',
    studentName: 'João Silva',
    score: 8,
    maxScore: 10,
    percentage: 80.0,
    status: 'SUBMITTED',
    timeSpentMinutes: 12,
    startedAt: '2023-01-01T10:00:00Z',
    submittedAt: '2023-01-01T10:12:00Z'
  }
]

const mockAssignmentStatistics = {
  assignmentId: 'assignment1',
  quizTitle: 'Quiz de Matemática',
  className: 'Turma 7ºA',
  totalAssigned: 30,
  totalAttempts: 25,
  completionRate: 83.3,
  averageScore: 75.5,
  status: 'ACTIVE',
  dueDate: '2023-12-31T23:59:59Z'
}

export const handlers = [
  // Quiz endpoints
  http.get('/api/quizzes', () => {
    return new Response(JSON.stringify(mockQuizzes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/quizzes/:quizId', ({ params }) => {
    const { quizId } = params
    const quiz = mockQuizzes.find(q => q.id === quizId)
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // Classes endpoints
  http.get('/api/classes', () => {
    return new Response(JSON.stringify(mockClasses), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/classes/:classId', ({ params }) => {
    const { classId } = params
    const classItem = mockClasses.find(c => c.id === classId)
    if (!classItem) {
      return new Response(JSON.stringify({ error: 'Class not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify(classItem), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post('/api/classes', async ({ request }) => {
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: 'new-class', ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.put('/api/classes/:classId', async ({ params, request }) => {
    const { classId } = params
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: classId, ...body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete('/api/classes/:classId', () => {
    return new Response(null, { status: 204 })
  }),

  // Assignments endpoints
  http.get('/api/assignments', () => {
    return new Response(JSON.stringify(mockAssignments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/assignments/:assignmentId', ({ params }) => {
    const { assignmentId } = params
    const assignment = mockAssignments.find(a => a.id === assignmentId)
    if (!assignment) {
      return new Response(JSON.stringify({ error: 'Assignment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify(assignment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post('/api/assignments', async ({ request }) => {
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: 'new-assignment', ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.put('/api/assignments/:assignmentId', async ({ params, request }) => {
    const { assignmentId } = params
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: assignmentId, ...body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete('/api/assignments/:assignmentId', () => {
    return new Response(null, { status: 204 })
  }),

  // Statistics endpoints
  http.get('/api/statistics/quiz/:quizId', ({ params }) => {
    const { quizId } = params
    if (quizId === 'quiz1') {
      return new Response(JSON.stringify(mockQuizStatistics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Quiz statistics not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/statistics/class/:classId', ({ params }) => {
    const { classId } = params
    if (classId === 'class1') {
      return new Response(JSON.stringify(mockClassStatistics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Class statistics not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/statistics/student/:studentId/attempts', ({ params }) => {
    const { studentId } = params
    if (studentId === 'student1') {
      return new Response(JSON.stringify(mockStudentAttempts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Student attempts not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/statistics/quiz/:quizId/attempts', ({ params }) => {
    const { quizId } = params
    if (quizId === 'quiz1') {
      return new Response(JSON.stringify(mockStudentAttempts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Quiz attempts not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/statistics/assignment/:assignmentId', ({ params }) => {
    const { assignmentId } = params
    if (assignmentId === 'assignment1') {
      return new Response(JSON.stringify(mockAssignmentStatistics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Assignment statistics not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // Share endpoints
  http.get('/api/shares/received', () => {
    const mockReceivedQuizzes = [
      {
        id: 'shared1',
        quizId: 'quiz1',
        quizTitle: 'Quiz de Matemática Compartilhado',
        sharedBy: 'teacher2',
        sharedByName: 'Professor João',
        sharedAt: '2023-01-01T00:00:00Z',
        canEdit: false,
      },
      {
        id: 'shared2',
        quizId: 'quiz2',
        quizTitle: 'Quiz de História Compartilhado',
        sharedBy: 'teacher3',
        sharedByName: 'Professora Maria',
        sharedAt: '2023-01-02T00:00:00Z',
        canEdit: true,
      },
    ]
    return new Response(JSON.stringify(mockReceivedQuizzes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('/api/shares/sent', () => {
    const mockSharedQuizzes = [
      {
        id: 'shared3',
        quizId: 'quiz3',
        quizTitle: 'Quiz de Geografia',
        sharedWith: 'teacher4',
        sharedWithName: 'Professor Pedro',
        sharedAt: '2023-01-03T00:00:00Z',
        canEdit: true,
      },
    ]
    return new Response(JSON.stringify(mockSharedQuizzes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post('/api/shares', async ({ request }) => {
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: 'new-share', ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post('/api/shares/:shareId/fork', async ({ params, request }) => {
    const body = await request.json() as any
    return new Response(JSON.stringify({ id: 'forked-quiz', ...body }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete('/api/shares/:shareId', () => {
    return new Response(null, { status: 204 })
  }),

  // Classes students endpoints
  http.get('/api/classes/:classId/students', ({ params }) => {
    const mockStudents = [
      {
        id: 'student1',
        name: 'João Silva',
        email: 'joao.silva@escola.com',
        enrolledAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'student2',
        name: 'Maria Santos',
        email: 'maria.santos@escola.com',
        enrolledAt: '2023-01-02T00:00:00Z',
      },
    ]
    return new Response(JSON.stringify(mockStudents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post('/api/classes/:classId/students', async ({ request }) => {
    const body = await request.json() as any
    return new Response(JSON.stringify({ success: true, message: 'Aluno matriculado com sucesso' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete('/api/classes/:classId/students/:studentId', () => {
    return new Response(null, { status: 204 })
  })
]

export const server = setupServer(...handlers)