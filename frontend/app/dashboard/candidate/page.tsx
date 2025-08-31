'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { jobsAPI, assessmentsAPI, onboardingAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  FileText, 
  Brain, 
  GraduationCap, 
  Eye, 
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CandidatePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'applications' | 'assessments' | 'onboarding'>('applications')

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => jobsAPI.getAll({ my: true }),
    select: (data) => data.data,
    enabled: activeTab === 'applications'
  })

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['candidate-assessments'],
    queryFn: () => assessmentsAPI.getMyAssessments(),
    select: (data) => data.data,
    enabled: activeTab === 'assessments'
  })

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ['candidate-onboarding'],
    queryFn: () => onboardingAPI.getProgress({ my: true }),
    select: (data) => data.data,
    enabled: activeTab === 'onboarding'
  })

  const isLoading = applicationsLoading || assessmentsLoading || onboardingLoading

  const getApplicationStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-purple-100 text-purple-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAssessmentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getOnboardingStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-sm text-gray-600">
                Track your applications, assessments, and onboarding progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'assessments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'onboarding'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Onboarding
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications?.applications?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Under Review</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications?.applications?.filter((app: any) => app.status === 'reviewing').length || 0}
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications?.applications?.filter((app: any) => app.status === 'shortlisted').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications?.applications?.map((application: any) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{application.job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {application.job.company.name}
                        </CardDescription>
                      </div>
                      <Badge className={getApplicationStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Applied:</span>
                        <span>{formatDate(application.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {application.job.location || 'Remote'}
                        </span>
                      </div>
                      {application.job.salaryMin && application.job.salaryMax && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Salary:</span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatCurrency(application.job.salaryMin)} - {formatCurrency(application.job.salaryMax)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View Job
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-4 h-4 mr-1" />
                        Application
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {applications?.applications?.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">
                  Start your job search by applying to positions
                </p>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessments?.assessments?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assessments?.assessments?.filter((ass: any) => ass.status === 'pending').length || 0}
                      </p>
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
                      <p className="text-2xl font-bold text-gray-900">
                        {assessments?.assessments?.filter((ass: any) => ass.status === 'completed').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments?.assessments?.map((assessment: any) => (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assessment.application.job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {assessment.type.replace('_', ' ')} Assessment
                        </CardDescription>
                      </div>
                      <Badge className={getAssessmentStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Due:</span>
                        <span>{formatDate(assessment.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Limit:</span>
                        <span>{assessment.timeLimit || 'No limit'} min</span>
                      </div>
                      {assessment.score && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span>{assessment.score}%</span>
                        </div>
                      )}
                    </div>
                                         <div className="flex space-x-2 mt-4">
                       {assessment.status === 'pending' && (
                         <Button 
                           size="sm" 
                           className="flex-1"
                           onClick={() => router.push(`/assessment/${assessment.id}`)}
                         >
                           <Play className="w-4 h-4 mr-1" />
                           Start
                         </Button>
                       )}
                       {assessment.status === 'completed' && (
                         <Button variant="outline" size="sm" className="flex-1">
                           <Eye className="w-4 h-4 mr-1" />
                           View Results
                         </Button>
                       )}
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {assessments?.assessments?.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete job applications to receive assessments
                </p>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Modules</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {onboarding?.modules?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {onboarding?.modules?.filter((mod: any) => mod.status === 'in_progress').length || 0}
                      </p>
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
                      <p className="text-2xl font-bold text-gray-900">
                        {onboarding?.modules?.filter((mod: any) => mod.status === 'completed').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onboarding?.modules?.map((module: any) => (
                <Card key={module.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {module.description}
                        </CardDescription>
                      </div>
                      <Badge className={getOnboardingStatusColor(module.status)}>
                        {module.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span>{module.duration || 'N/A'} min</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress:</span>
                        <span>{module.progress || 0}%</span>
                      </div>
                      {module.completedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completed:</span>
                          <span>{formatDate(module.completedAt)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      {module.status === 'not_started' && (
                        <Button size="sm" className="flex-1">
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {module.status === 'in_progress' && (
                        <Button size="sm" className="flex-1">
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {module.status === 'completed' && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {onboarding?.modules?.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No onboarding modules</h3>
                <p className="text-gray-600 mb-4">
                  Complete your hiring process to access onboarding materials
                </p>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
