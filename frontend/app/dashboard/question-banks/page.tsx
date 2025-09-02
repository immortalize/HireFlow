'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { questionBanksAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  FileText, 
  Users, 
  BarChart3,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number | null
  category?: string
  difficulty?: number
}

interface QuestionStats {
  cognitive: {
    logic: number
    math: number
    verbal: number
    total: number
  }
  english: number
  situational: number
  fitCheck: number
  total: number
}

export default function QuestionBanksPage() {
  const [selectedType, setSelectedType] = useState<string>('COGNITIVE')
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)

  // Fetch question bank statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['question-banks-stats'],
    queryFn: () => questionBanksAPI.getStats(),
    select: (data) => data.data?.stats
  })

  // Fetch questions by type
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['question-banks-questions', selectedType, selectedDifficulty],
    queryFn: () => questionBanksAPI.getQuestions(selectedType, { 
      difficulty: selectedDifficulty,
      count: 20 
    }),
    select: (data) => data.data,
    enabled: !!selectedType
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['question-banks-categories'],
    queryFn: () => questionBanksAPI.getCategories(),
    select: (data) => data.data?.categories
  })

  // Fetch difficulties
  const { data: difficulties } = useQuery({
    queryKey: ['question-banks-difficulties'],
    queryFn: () => questionBanksAPI.getDifficulties(),
    select: (data) => data.data?.difficulties
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COGNITIVE':
        return Brain
      case 'ENGLISH':
        return FileText
      case 'SITUATIONAL_JUDGMENT':
      case 'FIT_CHECK':
        return Users
      default:
        return BookOpen
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COGNITIVE':
        return 'bg-blue-100 text-blue-800'
      case 'ENGLISH':
        return 'bg-green-100 text-green-800'
      case 'SITUATIONAL_JUDGMENT':
        return 'bg-purple-100 text-purple-800'
      case 'FIT_CHECK':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'bg-green-100 text-green-800'
      case 2:
        return 'bg-yellow-100 text-yellow-800'
      case 3:
        return 'bg-orange-100 text-orange-800'
      case 4:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question banks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Question Banks</h1>
              <p className="text-sm text-gray-600">
                Manage and view assessment question banks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cognitive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.cognitive?.total || 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Logic: {stats?.cognitive?.logic || 0} • Math: {stats?.cognitive?.math || 0} • Verbal: {stats?.cognitive?.verbal || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">English</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.english || 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Grammar & Vocabulary
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Situational</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.situational || 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Workplace Scenarios
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cultural Fit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.fitCheck || 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Work Preferences
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Type Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Question Types</CardTitle>
                <CardDescription>
                  Select a question type to view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['COGNITIVE', 'ENGLISH', 'SITUATIONAL_JUDGMENT', 'FIT_CHECK'].map((type) => {
                  const Icon = getTypeIcon(type)
                  const isSelected = selectedType === type
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stats?.[type.toLowerCase()] || 0} questions
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Difficulty Filter */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Difficulty Filter</CardTitle>
                <CardDescription>
                  Filter by difficulty level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className={`w-full p-2 rounded text-left ${
                    selectedDifficulty === null 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  All Difficulties
                </button>
                {difficulties && Object.entries(difficulties).map(([level, name]) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(parseInt(level))}
                    className={`w-full p-2 rounded text-left ${
                      selectedDifficulty === parseInt(level)
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{name}</span>
                      <Badge className={getDifficultyColor(parseInt(level))}>
                        Level {level}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Questions Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedType.replace('_', ' ')} Questions
                    </CardTitle>
                    <CardDescription>
                      {questions?.total || 0} questions available
                      {selectedDifficulty && ` • ${difficulties?.[selectedDifficulty] || ''} difficulty`}
                    </CardDescription>
                  </div>
                  <Badge className={getTypeColor(selectedType)}>
                    {selectedType.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading questions...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                                         {Array.isArray(questions?.questions) ? (
                       (questions.questions as Question[]).map((question: Question, index: number) => (
                         <div key={question.id || index} className="border rounded-lg p-4">
                           <div className="flex items-start justify-between mb-3">
                             <h4 className="font-medium text-gray-900">
                               Question {index + 1}
                             </h4>
                             <div className="flex items-center space-x-2">
                               {question.category && (
                                 <Badge className="text-xs">
                                   {(categories?.[selectedType] as Record<string, string>)?.[question.category] || question.category}
                                 </Badge>
                               )}
                               {question.difficulty && (
                                 <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                                   {difficulties?.[question.difficulty] || `Level ${question.difficulty}`}
                                 </Badge>
                               )}
                             </div>
                           </div>
                           
                           <p className="text-gray-700 mb-3">{question.question}</p>
                           
                           <div className="space-y-2">
                             {question.options.map((option: string, optionIndex: number) => (
                               <div key={optionIndex} className="flex items-center space-x-2">
                                 <div className={`w-4 h-4 rounded border ${
                                   question.correctAnswer === optionIndex 
                                     ? 'bg-green-500 border-green-500' 
                                     : 'border-gray-300'
                                 }`}>
                                   {question.correctAnswer === optionIndex && (
                                     <CheckCircle className="w-4 h-4 text-white" />
                                   )}
                                 </div>
                                 <span className={`text-sm ${
                                   question.correctAnswer === optionIndex 
                                     ? 'text-green-700 font-medium' 
                                     : 'text-gray-600'
                                 }`}>
                                   {option}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))
                     ) : (
                       // Handle categorized questions (like cognitive)
                       Object.entries(questions?.questions || {}).map(([category, categoryQuestions]) => (
                         <div key={category}>
                                                        <h3 className="font-medium text-gray-900 mb-3">
                               {(categories?.[selectedType] as Record<string, string>)?.[category] || category}
                             </h3>
                           <div className="space-y-3">
                             {(categoryQuestions as Question[]).map((question: Question, index: number) => (
                               <div key={question.id || index} className="border rounded-lg p-4">
                                 <div className="flex items-start justify-between mb-3">
                                   <h4 className="font-medium text-gray-900">
                                     Question {index + 1}
                                   </h4>
                                   {question.difficulty && (
                                     <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                                       {difficulties?.[question.difficulty] || `Level ${question.difficulty}`}
                                     </Badge>
                                   )}
                                 </div>
                                 
                                 <p className="text-gray-700 mb-3">{question.question}</p>
                                 
                                 <div className="space-y-2">
                                   {question.options.map((option: string, optionIndex: number) => (
                                     <div key={optionIndex} className="flex items-center space-x-2">
                                       <div className={`w-4 h-4 rounded border ${
                                         question.correctAnswer === optionIndex 
                                           ? 'bg-green-500 border-green-500' 
                                           : 'border-gray-300'
                                       }`}>
                                         {question.correctAnswer === optionIndex && (
                                           <CheckCircle className="w-4 h-4 text-white" />
                                         )}
                                       </div>
                                       <span className={`text-sm ${
                                         question.correctAnswer === optionIndex 
                                           ? 'text-green-700 font-medium' 
                                           : 'text-gray-600'
                                       }`}>
                                         {option}
                                       </span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))
                     )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
