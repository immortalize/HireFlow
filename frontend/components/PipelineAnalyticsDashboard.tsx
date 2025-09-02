'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Award,
  Zap,
  Activity,
  Shield,
  Brain,
  FileText,
  User,
  Star,
  Lightbulb,
  XCircle
} from 'lucide-react'

interface PipelineAnalyticsProps {
  analytics: any
  pipeline: any
}

export default function PipelineAnalyticsDashboard({ analytics, pipeline }: PipelineAnalyticsProps) {
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

  const getAssessmentTypeIcon = (type: string) => {
    switch (type) {
      case 'COGNITIVE':
        return Brain
      case 'ENGLISH':
        return FileText
      case 'SITUATIONAL_JUDGMENT':
      case 'FIT_CHECK':
        return User
      default:
        return Brain
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalCandidates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.completedCandidates}</p>
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
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.inProgressCandidates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Overall Score Distribution</span>
          </CardTitle>
          <CardDescription>
            Performance breakdown across all assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Excellent</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.scoreDistribution.excellent}</p>
              <p className="text-sm text-green-600">
                {analytics.totalCandidates > 0 
                  ? Math.round((analytics.scoreDistribution.excellent / analytics.totalCandidates) * 100)
                  : 0}%
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Good</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{analytics.scoreDistribution.good}</p>
              <p className="text-sm text-blue-600">
                {analytics.totalCandidates > 0 
                  ? Math.round((analytics.scoreDistribution.good / analytics.totalCandidates) * 100)
                  : 0}%
              </p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Fair</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.scoreDistribution.fair}</p>
              <p className="text-sm text-yellow-600">
                {analytics.totalCandidates > 0 
                  ? Math.round((analytics.scoreDistribution.fair / analytics.totalCandidates) * 100)
                  : 0}%
              </p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Poor</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{analytics.scoreDistribution.poor}</p>
              <p className="text-sm text-red-600">
                {analytics.totalCandidates > 0 
                  ? Math.round((analytics.scoreDistribution.poor / analytics.totalCandidates) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Analytics */}
      {Object.keys(analytics.assessmentAnalytics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Assessment Performance</span>
            </CardTitle>
            <CardDescription>
              Detailed performance by assessment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.assessmentAnalytics).map(([assessmentId, data]: [string, any]) => {
                const Icon = getAssessmentTypeIcon(data.type)
                return (
                  <div key={assessmentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">
                          {data.type.replace('_', ' ')} Assessment
                        </h4>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">
                        {data.totalAttempts} attempts
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Average Score</p>
                        <p className={`text-xl font-bold ${getScoreColor(data.averageScore)}`}>
                          {data.averageScore}%
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Highest Score</p>
                        <p className={`text-xl font-bold ${getScoreColor(data.highestScore)}`}>
                          {data.highestScore}%
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Lowest Score</p>
                        <p className={`text-xl font-bold ${getScoreColor(data.lowestScore)}`}>
                          {data.lowestScore}%
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Score Range</p>
                        <p className="text-xl font-bold text-gray-900">
                          {data.highestScore - data.lowestScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Fit Analysis */}
      {analytics.candidateFitAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Candidate Fit Analysis</span>
            </CardTitle>
            <CardDescription>
              Comprehensive fit assessment for each candidate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.candidateFitAnalysis.map((candidate: any) => (
                <div key={candidate.candidateId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{candidate.candidateName}</h4>
                      <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getFitBadgeColor(candidate.overallFit)}>
                        {candidate.overallFit.charAt(0).toUpperCase() + candidate.overallFit.slice(1)} Fit
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        Top {candidate.percentile}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Overall Score</p>
                      <p className={`text-xl font-bold ${getScoreColor(candidate.overallScore)}`}>
                        {candidate.overallScore}%
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Time Efficiency</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {candidate.timeEfficiency}%
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Assessments</p>
                      <p className="text-xl font-bold text-gray-900">
                        {candidate.completedAssessments}/{candidate.totalAssessments}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getScoreBadgeColor(candidate.overallScore)}>
                        {candidate.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Candidate Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {candidate.strengths.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <span>Strengths</span>
                        </h5>
                        <ul className="space-y-1">
                          {candidate.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {candidate.weaknesses.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>Areas for Improvement</span>
                        </h5>
                        <ul className="space-y-1">
                          {candidate.weaknesses.map((weakness: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-1">
                              <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {candidate.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                          <Star className="w-4 h-4 text-blue-500" />
                          <span>Recommendations</span>
                        </h5>
                        <ul className="space-y-1">
                          {candidate.recommendations.map((recommendation: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-1">
                              <Star className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
