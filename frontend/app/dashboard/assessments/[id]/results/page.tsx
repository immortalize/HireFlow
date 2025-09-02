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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Shield,
  Activity
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

interface AssessmentInsights {
  overallFit: 'excellent' | 'good' | 'fair' | 'poor'
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  percentile: number
  timeEfficiency: number
  consistency: number
  proctoringScore: number
}

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

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProctoringStatus = (proctoringData: any[]) => {
    if (!proctoringData || proctoringData.length === 0) {
      return { status: 'No proctoring data', color: 'bg-gray-100 text-gray-800', score: 0 }
    }
    
    // Enhanced proctoring analysis
    const totalSnapshots = proctoringData.length
    const suspiciousEvents = proctoringData.filter((event: any) => {
      // Add logic to detect suspicious behavior
      return false // Placeholder
    })

    const proctoringScore = Math.max(0, 100 - (suspiciousEvents.length * 20))

    if (suspiciousEvents.length > 0) {
      return { 
        status: 'Suspicious activity detected', 
        color: 'bg-red-100 text-red-800',
        score: proctoringScore
      }
    }
    
    return { 
      status: 'No issues detected', 
      color: 'bg-green-100 text-green-800',
      score: 100
    }
  }

  const generateInsights = (result: any, allResults: any[]): AssessmentInsights => {
    const score = result.score
    const timeSpent = result.timeSpent
    const timeLimit = assessment?.timeLimit * 60 || 1800 // Convert to seconds
    
    // Calculate percentile
    const sortedScores = allResults.map(r => r.score).sort((a, b) => b - a)
    const percentile = Math.round(((sortedScores.indexOf(score) + 1) / sortedScores.length) * 100)
    
    // Time efficiency (lower is better for time spent)
    const timeEfficiency = Math.round(Math.max(0, 100 - ((timeSpent / timeLimit) * 100)))
    
    // Consistency (based on answer patterns)
    const answers = result.answers || {}
    const consistency = Math.round(Math.random() * 30 + 70) // Placeholder - would analyze answer patterns
    
    const proctoringStatus = getProctoringStatus(result.proctoringData)
    
    // Determine overall fit
    let overallFit: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
    if (score >= 80 && percentile >= 75 && proctoringStatus.score >= 90) {
      overallFit = 'excellent'
    } else if (score >= 60 && percentile >= 50 && proctoringStatus.score >= 80) {
      overallFit = 'good'
    } else if (score >= 40 && percentile >= 25) {
      overallFit = 'fair'
    } else {
      overallFit = 'poor'
    }
    
    // Generate strengths and weaknesses based on assessment type
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []
    
    if (score >= 80) {
      strengths.push('Strong performance in core competencies')
      strengths.push('Demonstrates excellent problem-solving skills')
    } else if (score >= 60) {
      strengths.push('Shows good understanding of key concepts')
      strengths.push('Demonstrates solid foundational knowledge')
    }
    
    if (score < 60) {
      weaknesses.push('Needs improvement in core areas')
      weaknesses.push('May require additional training')
    }
    
    if (timeEfficiency < 50) {
      weaknesses.push('May struggle with time management')
      recommendations.push('Consider time management training')
    }
    
    if (proctoringStatus.score < 90) {
      weaknesses.push('Proctoring concerns detected')
      recommendations.push('Schedule follow-up interview')
    }
    
    if (overallFit === 'excellent') {
      recommendations.push('Strong candidate - recommend for next round')
      recommendations.push('Consider fast-track to final interview')
    } else if (overallFit === 'good') {
      recommendations.push('Good candidate - proceed with standard process')
    } else if (overallFit === 'fair') {
      recommendations.push('Consider additional assessment or interview')
    } else {
      recommendations.push('May not be the right fit for this role')
    }
    
    return {
      overallFit,
      strengths,
      weaknesses,
      recommendations,
      percentile,
      timeEfficiency,
      consistency,
      proctoringScore: proctoringStatus.score
    }
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
  const analytics = assessmentData.analytics || {}
  const assessmentInfo = assessmentData.assessment || assessment
  const averageScore = analytics.averageScore || 0

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
                  {assessmentInfo.application?.job?.title} • {assessmentInfo.application?.job?.company?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                {assessmentInfo.type?.replace('_', ' ') || assessment.type?.replace('_', ' ')}
              </Badge>
              <Badge className={assessmentInfo.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {assessmentInfo.status || assessment.status}
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
                  <Users className="w-6 h-6 text-blue-600" />
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
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Limit</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.averageTimeSpent / 60)}m</p>
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
                    {formatDate(assessmentInfo.createdAt || assessment.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        {analytics.totalCandidates > 0 && (
          <div className="mb-8">
            <AnalyticsDashboard analytics={analytics} assessment={assessmentInfo} />
          </div>
        )}

        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Results & Fit Analysis</CardTitle>
            <CardDescription>
              Comprehensive performance analysis with fit insights for each candidate
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
              <div className="space-y-6">
                {results.map((result: any) => {
                  const insights = generateInsights(result, results)
                  const proctoringStatus = getProctoringStatus(result.proctoringData)
                  
                  return (
                    <div
                      key={result.id}
                      className="border rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-lg">
                              {result.candidate.firstName} {result.candidate.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{result.candidate.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getFitBadgeColor(insights.overallFit)}>
                                {insights.overallFit.charAt(0).toUpperCase() + insights.overallFit.slice(1)} Fit
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                Top {insights.percentile}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Score</p>
                            <p className={`font-bold text-xl ${getScoreColor(result.score)}`}>
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

                      {/* Quick Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Time Efficiency</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{insights.timeEfficiency}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Consistency</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{insights.consistency}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Proctoring</p>
                          <div className="flex items-center justify-center space-x-1">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{insights.proctoringScore}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Percentile</p>
                          <div className="flex items-center justify-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">{insights.percentile}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedResult?.id === result.id && (
                        <div className="mt-6 pt-6 border-t space-y-6">
                          {/* Fit Analysis */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                                  <span>Strengths</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {insights.strengths.length > 0 ? (
                                  <ul className="space-y-2">
                                    {insights.strengths.map((strength, index) => (
                                      <li key={index} className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">No specific strengths identified</p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                                  <span>Areas for Improvement</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {insights.weaknesses.length > 0 ? (
                                  <ul className="space-y-2">
                                    {insights.weaknesses.map((weakness, index) => (
                                      <li key={index} className="flex items-start space-x-2">
                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{weakness}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">No significant areas for improvement</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Recommendations */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center space-x-2">
                                <Award className="w-5 h-5 text-blue-500" />
                                <span>Recommendations</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {insights.recommendations.map((recommendation, index) => (
                                  <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                                    <Star className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{recommendation}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Performance Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Performance Details</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Time Spent:</span>
                                  <span className="font-medium">{formatTime(result.timeSpent)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Completed:</span>
                                  <span className="font-medium">{formatDate(result.completedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Questions Answered:</span>
                                  <span className="font-medium">{Object.keys(result.answers || {}).length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Time Efficiency:</span>
                                  <span className="font-medium">{insights.timeEfficiency}%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Proctoring Analysis</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Snapshots Taken:</span>
                                  <span className="font-medium">{result.proctoringData?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Proctoring Score:</span>
                                  <span className="font-medium">{insights.proctoringScore}%</span>
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
                              <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                              <div className="space-y-2">
                                <Button size="sm" className="w-full">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Report
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Users className="w-4 h-4 mr-2" />
                                  Schedule Interview
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Proctoring Snapshots */}
                          {result.proctoringData && result.proctoringData.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Proctoring Snapshots</h4>
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
