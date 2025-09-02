'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { pipelinesAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Link, 
  Plus, 
  Users, 
  Clock, 
  Copy, 
  Eye,
  Brain,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '@/lib/clipboard'

interface Assessment {
  id: string
  type: string
  timeLimit: number
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  status: string
}

interface Pipeline {
  id: string
  name: string
  description?: string
  token: string
  expiresAt?: string
  createdAt: string
  assessments: Assessment[]
  candidates: Candidate[]
  _count?: {
    candidates: number
  }
}

export default function PipelinesPage() {
  const router = useRouter()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Fetch pipelines
  const { data: pipelines, isLoading, error } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesAPI.getAll(),
    select: (data) => data.data?.pipelines || []
  })

  const copyToClipboardHandler = async (token: string) => {
    const url = `${window.location.origin}/pipeline/${token}`
    const success = await copyToClipboard(url)
    
    if (success) {
      setCopiedToken(token)
      toast.success('Pipeline link copied to clipboard!')
      setTimeout(() => setCopiedToken(null), 2000)
    } else {
      toast.error('Failed to copy link. Please copy manually: ' + url)
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
        return Users
      default:
        return Brain
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipelines...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading pipelines</h3>
          <p className="text-gray-600">Please try again later</p>
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hiring Pipelines</h1>
                <p className="text-sm text-gray-600">
                  Create and manage assessment pipelines for candidates
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/dashboard/pipelines/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pipeline
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pipelines.length === 0 ? (
          <div className="text-center py-12">
            <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pipelines yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first hiring pipeline to start assessing candidates
            </p>
            <Button onClick={() => router.push('/dashboard/pipelines/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Pipeline
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline: Pipeline) => (
              <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {pipeline.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpired(pipeline.expiresAt) && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          Expired
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/pipelines/${pipeline.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Assessments */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assessments</h4>
                    <div className="space-y-1">
                      {pipeline.assessments.slice(0, 3).map((assessment: Assessment) => {
                        const Icon = getAssessmentTypeIcon(assessment.type)
                        return (
                          <div key={assessment.id} className="flex items-center space-x-2 text-sm">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {assessment.type.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{assessment.timeLimit}m</span>
                          </div>
                        )
                      })}
                      {pipeline.assessments.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{pipeline.assessments.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Candidates</p>
                      <p className="font-medium text-gray-900">
                        {pipeline._count?.candidates || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-medium text-gray-900">
                        {pipeline.candidates?.filter((c: Candidate) => c.status === 'COMPLETED').length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Recent Candidates */}
                  {pipeline.candidates && pipeline.candidates.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Candidates</h4>
                      <div className="space-y-1">
                        {pipeline.candidates.slice(0, 3).map((candidate: Candidate) => (
                          <div key={candidate.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {candidate.firstName} {candidate.lastName}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(candidate.status)}`}>
                              {candidate.status}
                            </Badge>
                          </div>
                        ))}
                        {pipeline.candidates.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{pipeline.candidates.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboardHandler(pipeline.token)}
                      className="flex-1"
                    >
                      {copiedToken === pipeline.token ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copiedToken === pipeline.token ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/pipeline/${pipeline.token}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>Created {formatDate(pipeline.createdAt)}</span>
                    {pipeline.expiresAt && (
                      <span className={isExpired(pipeline.expiresAt) ? 'text-red-500' : ''}>
                        Expires {formatDate(pipeline.expiresAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
