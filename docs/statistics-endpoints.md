# Statistics and Reports Endpoints

This document describes the new statistics and reports endpoints implemented in the Angela Quiz frontend.

## Overview

The statistics endpoints provide teachers and administrators with detailed insights into quiz performance, class progress, student attempts, and assignment completion rates. These endpoints are designed to support data-driven decision making and educational analytics.

## Available Endpoints

### 1. Quiz Statistics

**Endpoint**: `GET /api/quizzes/{quizId}/statistics`

**Function**: `statisticsApi.getQuizStatistics(quizId)`

**Description**: Retrieves comprehensive statistics for a specific quiz, including:
- Total number of attempts
- Average, maximum, and minimum scores
- Pass rate
- Average completion time
- Question-level performance data
- Attempts grouped by date

**Usage Example**:
```javascript
import { statisticsApi } from '../lib/api';

const quizStats = await statisticsApi.getQuizStatistics('quiz-123');
console.log('Average score:', quizStats.averageScore);
console.log('Total attempts:', quizStats.totalAttempts);
```

### 2. Class Statistics

**Endpoint**: `GET /api/classes/{classId}/statistics`

**Function**: `statisticsApi.getClassStatistics(classId)`

**Description**: Provides statistics for an entire class, including:
- Total and active student counts
- Overall class performance metrics
- Lists of top-performing and struggling students
- Quiz-specific statistics for the class

**Usage Example**:
```javascript
const classStats = await statisticsApi.getClassStatistics('class-456');
console.log('Class average:', classStats.averageScore);
console.log('Top performers:', classStats.topPerformers);
```

### 3. Student Attempts

**Endpoint**: `GET /api/students/{studentId}/attempts`

**Function**: `statisticsApi.getStudentAttempts(studentId, quizId?)`

**Description**: Retrieves all attempts made by a specific student, optionally filtered by quiz:
- All attempts with scores and completion status
- Time spent on each attempt
- Detailed answer information

**Usage Example**:
```javascript
// Get all attempts for a student
const allAttempts = await statisticsApi.getStudentAttempts('student-789');

// Get attempts for a specific quiz
const quizAttempts = await statisticsApi.getStudentAttempts('student-789', 'quiz-123');
```

### 4. Quiz Attempts

**Endpoint**: `GET /api/quizzes/{quizId}/attempts`

**Function**: `statisticsApi.getQuizAttempts(quizId)`

**Description**: Retrieves all attempts for a specific quiz across all students:
- Complete attempt history
- Performance metrics
- Completion times

**Usage Example**:
```javascript
const attempts = await statisticsApi.getQuizAttempts('quiz-123');
console.log('All quiz attempts:', attempts);
```

### 5. Assignment Statistics

**Endpoint**: `GET /api/assignments/{assignmentId}/statistics`

**Function**: `statisticsApi.getAssignmentStatistics(assignmentId)`

**Description**: Provides detailed statistics for a specific assignment:
- Completion rates
- Average scores and times
- Assignment status and due date information

**Usage Example**:
```javascript
const assignmentStats = await statisticsApi.getAssignmentStatistics('assignment-456');
console.log('Completion rate:', assignmentStats.completionRate);
```

## Data Types

### QuizStatistics
```typescript
interface QuizStatistics {
  quizId: string;
  title: string;
  totalAttempts: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  averageTimeMinutes: number;
  questionStatistics: QuestionStatistics[];
  attemptsByDate: AttemptsByDate[];
}
```

### ClassStatistics
```typescript
interface ClassStatistics {
  classId: string;
  name: string;
  totalStudents: number;
  activeStudents: number;
  totalAttempts: number;
  averageScore: number;
  quizStatistics: QuizStatistics[];
  topPerformers: StudentPerformance[];
  strugglingStudents: StudentPerformance[];
}
```

### StudentAttempt
```typescript
interface StudentAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  assignmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  startedAt: string;
  submittedAt?: string | null;
  timeSpentMinutes: number;
  answers: Record<string, any>;
}
```

### AssignmentStatistics
```typescript
interface AssignmentStatistics {
  assignmentId: string;
  quizId: string;
  quizTitle: string;
  classId?: string;
  className?: string;
  totalAssigned: number;
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTimeMinutes: number;
  dueDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT';
}
```

## Reports Page

A new Reports page (`/reports`) has been added to the application, accessible to teachers and administrators. This page provides:

1. **Quiz Statistics Tab**: View detailed performance metrics for specific quizzes
2. **Class Statistics Tab**: Monitor class-wide performance and identify students needing support
3. **Student Attempts Tab**: Track individual student progress and attempt history
4. **Assignment Statistics Tab**: Analyze assignment completion and effectiveness

### Accessing the Reports Page

1. Log in as a teacher or administrator
2. Navigate to the Dashboard
3. Click the "Relatórios" button in the top right
4. Select the desired tab and enter the appropriate ID

## Error Handling

All statistics endpoints include proper error handling:
- Network errors are caught and displayed to the user
- Invalid IDs return appropriate error messages
- Loading states are shown during data fetching
- Empty states are handled gracefully

## Integration with Existing Components

The statistics endpoints are designed to integrate seamlessly with existing components:
- Uses the same authentication and error handling patterns
- Follows the established API client architecture
- Compatible with existing routing and navigation
- Maintains consistent styling and UI patterns

## Future Enhancements

Potential improvements to the statistics system:
1. **Data Visualization**: Add charts and graphs for better data interpretation
2. **Export Functionality**: Allow exporting statistics to CSV or PDF
3. **Date Range Filtering**: Enable filtering statistics by date ranges
4. **Comparative Analysis**: Compare performance across different classes or time periods
5. **Real-time Updates**: Implement WebSocket connections for live statistics updates