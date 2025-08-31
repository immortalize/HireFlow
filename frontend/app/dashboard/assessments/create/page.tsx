'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { assessmentsAPI, jobsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  ArrowLeft, 
  Plus, 
  FileText,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [assessmentType, setAssessmentType] = useState<string>('COGNITIVE')
  const [timeLimit, setTimeLimit] = useState<number>(30)

  // Fetch applications that don't have assessments yet
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications-without-assessments'],
    queryFn: () => jobsAPI.getApplicationsNeedingAssessments(),
    select: (data) => data.data
  })

  // Create assessment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => assessmentsAPI.create(data),
    onSuccess: (response) => {
      toast.success('Assessment created successfully!')
      router.push('/dashboard/assessments')
    },
    onError: (error) => {
      toast.error('Failed to create assessment')
      console.error('Create error:', error)
    }
  })

  const handleCreateAssessment = () => {
    if (!selectedApplication) {
      toast.error('Please select an application')
      return
    }

    const assessmentData = {
      applicationId: selectedApplication,
      type: assessmentType,
      timeLimit
    }

    createMutation.mutate(assessmentData)
  }

  const getAssessmentTypeDescription = (type: string) => {
    const descriptions = {
      COGNITIVE: 'Tests logical reasoning, mathematical ability, and verbal comprehension',
      ENGLISH: 'Assesses English language proficiency and communication skills',
      SITUATIONAL_JUDGMENT: 'Evaluates decision-making in workplace scenarios',
      FIT_CHECK: 'Determines cultural fit and work preferences'
    }
    return descriptions[type as keyof typeof descriptions] || ''
  }

  const getAssessmentTypeIcon = (type: string) => {
    const icons = {
      COGNITIVE: Brain,
      ENGLISH: FileText,
      SITUATIONAL_JUDGMENT: Users,
      FIT_CHECK: Users
    }
    return icons[type as keyof typeof icons] || Brain
  }

  if (applicationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
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
                onClick={() => router.push('/dashboard/assessments')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Assessment</h1>
                <p className="text-sm text-gray-600">
                  Set up a new assessment for a job application
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Application</CardTitle>
              <CardDescription>
                Choose a job application that needs an assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications?.applications?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600 mb-4">
                    All applications already have assessments or no applications exist.
                  </p>
                  <Button onClick={() => router.push('/dashboard/jobs')}>
                    View Job Applications
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications?.applications?.map((application: any) => (
                    <div
                      key={application.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedApplication === application.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedApplication(application.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {application.job.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {application.job.company.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {application.candidate.firstName} {application.candidate.lastName}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {application.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Applied: {formatDate(application.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Configuration</CardTitle>
              <CardDescription>
                Configure the assessment type and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assessment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assessment Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {['COGNITIVE', 'ENGLISH', 'SITUATIONAL_JUDGMENT', 'FIT_CHECK'].map((type) => {
                    const Icon = getAssessmentTypeIcon(type)
                    return (
                      <div
                        key={type}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          assessmentType === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setAssessmentType(type)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            assessmentType === type ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              assessmentType === type ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {type.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {getAssessmentTypeDescription(type)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Time Limit Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes)
                </label>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="select w-full"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 30 minutes for most assessment types
                </p>
              </div>

              {/* Assessment Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Assessment Preview</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{assessmentType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{timeLimit} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">
                      {assessmentType === 'COGNITIVE' ? '25' : 
                       assessmentType === 'ENGLISH' ? '20' : 
                       assessmentType === 'SITUATIONAL_JUDGMENT' ? '15' : '10'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateAssessment}
                disabled={!selectedApplication || createMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Assessment
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Type Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Assessment Types Overview</CardTitle>
            <CardDescription>
              Learn more about each assessment type and when to use them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-blue-600" />
                  Cognitive Ability
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Tests logical reasoning, mathematical ability, and verbal comprehension. 
                  Best for roles requiring analytical thinking and problem-solving skills.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 25 multiple-choice questions</li>
                  <li>• Logic, math, and verbal sections</li>
                  <li>• 30-45 minutes recommended</li>
                  <li>• Suitable for most professional roles</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  English Proficiency
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Assesses English language skills including grammar, vocabulary, and 
                  communication. Ideal for customer-facing or international roles.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 20 grammar and vocabulary questions</li>
                  <li>• Reading comprehension included</li>
                  <li>• 20-30 minutes recommended</li>
                  <li>• Perfect for communication-heavy roles</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  Situational Judgment
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Evaluates decision-making skills in workplace scenarios. 
                  Great for leadership, management, and team-oriented positions.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 15 scenario-based questions</li>
                  <li>• Multiple-choice responses</li>
                  <li>• 20-30 minutes recommended</li>
                  <li>• Best for leadership roles</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-orange-600" />
                  Culture Fit Check
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Determines alignment with company culture and work preferences. 
                  Useful for ensuring long-term fit and satisfaction.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 10 preference-based questions</li>
                  <li>• Work style and values assessment</li>
                  <li>• 10-15 minutes recommended</li>
                  <li>• Important for culture-focused companies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
