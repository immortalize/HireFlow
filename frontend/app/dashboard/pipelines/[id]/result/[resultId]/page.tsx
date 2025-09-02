'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { pipelinesAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  FileText,
  Users,
  BarChart3,
  Calendar,
  User
} from 'lucide-react'

export default function DetailedAssessmentResultPage() {
  const params = useParams()
  const router = useRouter()
  const pipelineId = params.id as string
  const resultId = params.resultId as string

  // Fetch detailed result
  const { data: resultData, isLoading, error } = useQuery({
    queryKey: ['detailed-result', pipelineId, resultId],
    queryFn: () => pipelinesAPI.getDetailedResult(pipelineId, resultId),
    select: (data) => data.data,
    enabled: !!pipelineId && !!resultId
  })

  const result = resultData?.result

  const getAssessmentTypeInfo = (type: string) => {
    switch (type) {
      case 'COGNITIVE':
        return {
          name: 'Cognitive Ability',
          icon: Brain,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'ENGLISH':
        return {
          name: 'English Proficiency',
          icon: FileText,
          color: 'bg-green-100 text-green-800'
        }
      case 'SITUATIONAL_JUDGMENT':
      case 'FIT_CHECK':
        return {
          name: type.replace('_', ' '),
          icon: Users,
          color: 'bg-purple-100 text-purple-800'
        }
      default:
        return {
          name: 'Assessment',
          icon: Brain,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading detailed results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Result Not Found</h3>
          <p className="text-gray-600">The requested assessment result could not be found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/dashboard/pipelines/${pipelineId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pipeline
          </Button>
        </div>
      </div>
    )
  }

  const typeInfo = getAssessmentTypeInfo(result.assessment.type)
  const Icon = typeInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/pipelines/${pipelineId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pipeline
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detailed Assessment Result</h1>
                <p className="text-sm text-gray-600">
                  {result.candidate.firstName} {result.candidate.lastName} • {typeInfo.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getScoreBadgeColor(result.score || 0)}>
                {result.score?.toFixed(1) || 'N/A'}%
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {formatTime(result.timeSpent || 0)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessment Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{typeInfo.name} Assessment</span>
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of questions and answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.statistics.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.statistics.correctAnswers}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.statistics.wrongAnswers}
                    </div>
                    <div className="text-sm text-gray-600">Wrong</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.statistics.emptyAnswers}
                    </div>
                    <div className="text-sm text-gray-600">Empty</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(result.score || 0)}`}>
                      {result.statistics.accuracy}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(result.timeSpent || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Time Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.assessment.timeLimit || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Time Limit (min)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions and Answers */}
            <Card>
              <CardHeader>
                <CardTitle>Questions & Answers</CardTitle>
                <CardDescription>
                  Review each question with the candidate's answer and correct answer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {result.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Question {question.questionNumber}</span>
                          {question.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : question.isAnswered ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <Badge 
                          className={
                            question.isCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : question.isAnswered 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {question.isCorrect ? 'Correct' : question.isAnswered ? 'Wrong' : 'Empty'}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {question.question}
                        </h3>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex} 
                              className={`p-3 rounded-lg border ${
                                question.correctAnswer === optionIndex 
                                  ? 'bg-green-50 border-green-200' 
                                  : question.candidateAnswer === optionIndex 
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-gray-900">{option}</span>
                                {question.correctAnswer === optionIndex && (
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                                {question.candidateAnswer === optionIndex && question.candidateAnswer !== question.correctAnswer && (
                                  <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Answer Summary */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Candidate's Answer:</span>
                          <div className="font-medium text-gray-900 mt-1">
                            {question.candidateAnswer !== null && question.candidateAnswer !== undefined && question.candidateAnswer !== ''
                              ? `${String.fromCharCode(65 + question.candidateAnswer)}. ${question.options[question.candidateAnswer]}`
                              : 'No answer provided'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Correct Answer:</span>
                          <div className="font-medium text-green-700 mt-1">
                            {question.correctAnswer !== undefined
                              ? `${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}`
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Explanation:</h4>
                          <p className="text-sm text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Candidate Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {result.candidate.firstName} {result.candidate.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{result.candidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(result.completedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(result.score || 0)}`}>
                    {result.score?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <span className="font-medium text-gray-900">{result.statistics.accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Efficiency</span>
                    <span className="font-medium text-gray-900">
                      {result.assessment.timeLimit 
                        ? Math.round(((result.timeSpent || 0) / 60 / result.assessment.timeLimit) * 100)
                        : 'N/A'
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(((result.statistics.correctAnswers + result.statistics.wrongAnswers) / result.statistics.totalQuestions) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>Assessment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{typeInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Limit</p>
                  <p className="font-medium text-gray-900">
                    {result.assessment.timeLimit ? `${result.assessment.timeLimit} minutes` : 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium text-gray-900">{result.statistics.totalQuestions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
