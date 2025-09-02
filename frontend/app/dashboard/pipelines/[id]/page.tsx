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
  Copy, 
  ExternalLink,
  Users,
  Brain,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
  Phone
} from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '@/lib/clipboard'
import PipelineAnalyticsDashboard from '@/components/PipelineAnalyticsDashboard'

export default function PipelineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pipelineId = params.id as string
  const [copiedToken, setCopiedToken] = useState(false)

  // Fetch pipeline details
  const { data: pipelineData, isLoading, error } = useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: () => pipelinesAPI.getById(pipelineId),
    select: (data) => data.data,
    enabled: !!pipelineId
  })

  const pipeline = pipelineData?.pipeline
  const analytics = pipelineData?.analytics || {}

  const copyToClipboardHandler = async () => {
    if (!pipeline) return
    
    const url = `${window.location.origin}/pipeline/${pipeline.token}`
    const success = await copyToClipboard(url)
    
    if (success) {
      setCopiedToken(true)
      toast.success('Pipeline link copied to clipboard!')
      setTimeout(() => setCopiedToken(false), 2000)
    } else {
      toast.error('Failed to copy link. Please copy manually: ' + url)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'STARTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'INVITED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  if (error || !pipeline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline Not Found</h3>
          <p className="text-gray-600">The requested pipeline could not be found.</p>
        </div>
      </div>
    )
  }

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
                onClick={() => router.push('/dashboard/pipelines')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pipeline.name}</h1>
                <p className="text-sm text-gray-600">
                  Created by {pipeline.createdBy?.firstName} {pipeline.createdBy?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                                  onClick={copyToClipboardHandler}
              >
                {copiedToken ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copiedToken ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/pipeline/${pipeline.token}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Pipeline
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pipeline Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analytics Dashboard */}
            {analytics.totalCandidates > 0 && (
              <PipelineAnalyticsDashboard analytics={analytics} pipeline={pipeline} />
            )}

            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Overview</CardTitle>
                <CardDescription>
                  Basic information about this hiring pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">
                    {pipeline.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(pipeline.createdAt)}
                    </p>
                  </div>
                  {pipeline.expiresAt && (
                    <div>
                      <p className="text-sm text-gray-500">Expires</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(pipeline.expiresAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  Assessment types included in this pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pipeline.assessments.map((assessment) => {
                    const typeInfo = getAssessmentTypeInfo(assessment.type)
                    const Icon = typeInfo.icon
                    
                    return (
                      <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{typeInfo.name}</h4>
                            <p className="text-sm text-gray-600">
                              {assessment.timeLimit} minutes • {assessment.isRequired ? 'Required' : 'Optional'}
                            </p>
                          </div>
                        </div>
                        <Badge className="text-xs">
                          Order {assessment.order}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Candidates */}
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>
                  People who have taken or are taking this pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pipeline.candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
                    <p className="text-gray-600">
                      Share the pipeline link to start receiving candidates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pipeline.candidates.map((candidate) => (
                      <div key={candidate.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {candidate.firstName[0]}{candidate.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {candidate.firstName} {candidate.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{candidate.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                            <div className="text-right text-sm text-gray-500">
                              <div>Started: {formatDate(candidate.startedAt)}</div>
                              {candidate.completedAt && (
                                <div>Completed: {formatDate(candidate.completedAt)}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Fit Analysis */}
                        {analytics.candidateFitAnalysis && analytics.candidateFitAnalysis.length > 0 && (
                          (() => {
                            const fitData = analytics.candidateFitAnalysis.find((c: any) => c.candidateId === candidate.id)
                            if (fitData) {
                              return (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-gray-700">Fit Analysis</h5>
                                    <div className="flex items-center space-x-2">
                                      <Badge className={getFitBadgeColor(fitData.overallFit)}>
                                        {fitData.overallFit.charAt(0).toUpperCase() + fitData.overallFit.slice(1)} Fit
                                      </Badge>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        Top {fitData.percentile}%
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="text-center">
                                      <p className="text-gray-500">Score</p>
                                      <p className={`font-medium ${getScoreColor(fitData.overallScore)}`}>
                                        {fitData.overallScore}%
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-gray-500">Time Eff.</p>
                                      <p className="font-medium text-yellow-600">
                                        {fitData.timeEfficiency}%
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-gray-500">Progress</p>
                                      <p className="font-medium text-gray-900">
                                        {fitData.completedAssessments}/{fitData.totalAssessments}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()
                        )}
                        
                        {/* Results */}
                        {candidate.results && candidate.results.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Assessment Results</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {candidate.results.map((result) => (
                                <div key={result.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {getAssessmentTypeInfo(result.assessment.type).name}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    {result.score !== null && (
                                      <span className="font-medium text-gray-900">
                                        {result.score.toFixed(1)}%
                                      </span>
                                    )}
                                    <span className="text-gray-500">
                                      {Math.floor((result.timeSpent || 0) / 60)}m
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/dashboard/pipelines/${pipelineId}/result/${result.id}`)}
                                      className="text-xs"
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Detailed Results from Analytics */}
                        {analytics.candidateFitAnalysis && analytics.candidateFitAnalysis.length > 0 && (
                          (() => {
                            const fitData = analytics.candidateFitAnalysis.find((c: any) => c.candidateId === candidate.id)
                            if (fitData && fitData.detailedResults && fitData.detailedResults.length > 0) {
                              return (
                                <div className="mt-3 pt-3 border-t">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Detailed Results</h5>
                                  <div className="space-y-2">
                                    {fitData.detailedResults.map((result: any, index: number) => (
                                      <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-700">
                                            {result.assessmentType.replace('_', ' ')}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            <Badge className={getScoreBadgeColor(result.score)}>
                                              {result.score}%
                                            </Badge>
                                            <span className="text-gray-500">
                                              {Math.floor((result.timeSpent || 0) / 60)}m
                                            </span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                          <div className="text-center">
                                            <span className="text-gray-500">Correct:</span>
                                            <span className="font-medium text-green-600 ml-1">{result.correctAnswers}</span>
                                          </div>
                                          <div className="text-center">
                                            <span className="text-gray-500">Wrong:</span>
                                            <span className="font-medium text-red-600 ml-1">{result.wrongAnswers}</span>
                                          </div>
                                          <div className="text-center">
                                            <span className="text-gray-500">Empty:</span>
                                            <span className="font-medium text-yellow-600 ml-1">{result.emptyAnswers}</span>
                                          </div>
                                          <div className="text-center">
                                            <span className="text-gray-500">Accuracy:</span>
                                            <span className="font-medium text-blue-600 ml-1">{result.accuracy}%</span>
                                          </div>
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/pipelines/${pipelineId}/result/${result.resultId}`)}
                                            className="text-xs"
                                          >
                                            View Details
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pipeline Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {pipeline.candidates.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Candidates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pipeline.candidates.filter(c => c.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {pipeline.candidates.filter(c => c.status === 'IN_PROGRESS').length}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {pipeline.assessments.length}
                    </div>
                    <div className="text-sm text-gray-600">Assessments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Share Pipeline</CardTitle>
                <CardDescription>
                  Share this link with candidates to start the assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Pipeline URL:</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {`${window.location.origin}/pipeline/${pipeline.token}`}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboardHandler}
                    className="flex-1"
                  >
                    {copiedToken ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedToken ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/pipeline/${pipeline.token}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
