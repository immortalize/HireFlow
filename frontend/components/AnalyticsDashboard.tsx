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
  Shield
} from 'lucide-react'

interface AnalyticsDashboardProps {
  analytics: any
  assessment: any
}

export default function AnalyticsDashboard({ analytics, assessment }: AnalyticsDashboardProps) {
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
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                  {analytics.averageScore}%
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
                <p className="text-sm font-medium text-gray-600">Avg Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics.averageTimeSpent / 60)}m
                </p>
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
            <span>Score Distribution</span>
          </CardTitle>
          <CardDescription>
            Breakdown of candidate performance across different score ranges
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
                <AlertTriangle className="w-5 h-5 text-red-600" />
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

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Time Efficiency</span>
            </CardTitle>
            <CardDescription>
              Average time efficiency across all candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {analytics.timeEfficiency.length > 0 
                  ? Math.round(analytics.timeEfficiency.reduce((a, b) => a + b, 0) / analytics.timeEfficiency.length)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Higher percentage = better time management
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Proctoring Issues</span>
            </CardTitle>
            <CardDescription>
              Number of candidates with proctoring concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{analytics.proctoringIssues}</p>
              <p className="text-sm text-gray-600 mt-2">
                {analytics.totalCandidates > 0 
                  ? Math.round((analytics.proctoringIssues / analytics.totalCandidates) * 100)
                  : 0}% of candidates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Range Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Score Range Analysis</span>
          </CardTitle>
          <CardDescription>
            Performance range and key statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Highest Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.highestScore)}`}>
                {analytics.highestScore}%
              </p>
              <Badge className={getScoreBadgeColor(analytics.highestScore)}>
                {analytics.highestScore >= 80 ? 'Excellent' : analytics.highestScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Lowest Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.lowestScore)}`}>
                {analytics.lowestScore}%
              </p>
              <Badge className={getScoreBadgeColor(analytics.lowestScore)}>
                {analytics.lowestScore >= 80 ? 'Excellent' : analytics.lowestScore >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Score Range</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.highestScore - analytics.lowestScore}%
              </p>
              <p className="text-sm text-gray-600">
                {analytics.highestScore - analytics.lowestScore > 40 ? 'High variance' : 'Consistent performance'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
