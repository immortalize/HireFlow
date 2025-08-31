'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { assessmentsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Clock, 
  User, 
  Calendar,
  BarChart3,
  Eye,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const [selectedResult, setSelectedResult] = useState<any>(null)

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: () => assessmentsAPI.getResults(assessmentId),
    select: (data) => data.data
  })

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsAPI.getAssessment(assessmentId),
    select: (data) => data.data
  })

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

  const getProctoringStatus = (proctoringData: any[]) => {
    if (!proctoringData || proctoringData.length === 0) {
      return { status: 'No proctoring data', color: 'bg-gray-100 text-gray-800' }
    }
    
    // Simple proctoring analysis - could be enhanced with ML
    const suspiciousEvents = proctoringData.filter((event: any) => {
      // Add logic to detect suspicious behavior
      return false // Placeholder
    })

    if (suspiciousEvents.length > 0) {
      return { status: 'Suspicious activity detected', color: 'bg-red-100 text-red-800' }
    }
    
    return { status: 'No issues detected', color: 'bg-green-100 text-green-800' }
  }

  if (isLoading || assessmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    )
  }

  if (!assessment || !assessmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Assessment not found</p>
          <Button onClick={() => router.push('/dashboard/assessments')} className="mt-4">
            Back to Assessments
          </Button>
        </div>
      </div>
    )
  }

  const results = assessmentData.results || []
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum: number, r: any) => sum + r.score, 0) / results.length)
    : 0

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
                onClick={() => router.push('/dashboard/assessments')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
                <p className="text-sm text-gray-600">
                  {assessment.application.job.title} • {assessment.application.job.company.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                {assessment.type.replace('_', ' ')}
              </Badge>
              <Badge className={assessment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {assessment.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Limit</p>
                  <p className="text-2xl font-bold text-gray-900">{assessment.timeLimit} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDate(assessment.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Results</CardTitle>
            <CardDescription>
              Detailed performance analysis for each candidate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                <p className="text-gray-600">
                  Candidates haven't completed this assessment yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result: any) => {
                  const proctoringStatus = getProctoringStatus(result.proctoringData)
                  
                  return (
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {result.candidate.firstName} {result.candidate.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{result.candidate.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Score</p>
                            <p className={`font-bold ${getScoreColor(result.score)}`}>
                              {result.score}%
                            </p>
                          </div>
                          
                          <Badge className={getScoreBadgeColor(result.score)}>
                            {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                          
                          <Badge className={proctoringStatus.color}>
                            {proctoringStatus.status}
                          </Badge>
                          
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedResult?.id === result.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Performance Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Time Spent:</span>
                                  <span>{formatTime(result.timeSpent)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Completed:</span>
                                  <span>{formatDate(result.completedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Questions Answered:</span>
                                  <span>{Object.keys(result.answers || {}).length}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Proctoring Analysis</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Snapshots Taken:</span>
                                  <span>{result.proctoringData?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <Badge className={proctoringStatus.color} variant="outline">
                                    {proctoringStatus.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                              <div className="space-y-2">
                                <Button size="sm" className="w-full">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Report
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Proctoring Snapshots */}
                          {result.proctoringData && result.proctoringData.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Proctoring Snapshots</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {result.proctoringData.slice(0, 8).map((snapshot: any, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={snapshot.imageData}
                                      alt={`Snapshot ${index + 1}`}
                                      className="w-full h-20 object-cover rounded border"
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                      {new Date(snapshot.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
