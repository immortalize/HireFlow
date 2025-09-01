'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  Brain, 
  Building2, 
  BarChart3, 
  GraduationCap,
  Settings,
  LogOut,
  User,
  Link
} from 'lucide-react'
import { getRoleDisplayName } from '@/lib/utils'

export default function DashboardPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isEmployerRole = ['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER', 'BUSINESS_DEV'].includes(user.role)

  const dashboardItems = isEmployerRole ? [
    {
      title: 'Job Postings',
      description: 'Create and manage job listings',
      icon: FileText,
      href: '/dashboard/jobs',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Hiring Pipelines',
      description: 'Create and share assessment pipelines',
      icon: Link,
      href: '/dashboard/pipelines',
      color: 'bg-teal-100 text-teal-600'
    },
    {
      title: 'Assessments',
      description: 'Manage candidate assessments',
      icon: Brain,
      href: '/dashboard/assessments',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'CRM',
      description: 'Manage leads and partners',
      icon: Users,
      href: '/dashboard/crm',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Onboarding',
      description: 'Training and onboarding modules',
      icon: GraduationCap,
      href: '/dashboard/onboarding',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Team',
      description: 'Manage team members and settings',
      icon: Users,
      href: '/dashboard/team',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      title: 'Analytics',
      description: 'View hiring analytics and reports',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Settings',
      description: 'Company and user settings',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-100 text-gray-600'
    }
  ] : [
    {
      title: 'My Dashboard',
      description: 'View your applications and progress',
      icon: User,
      href: '/dashboard/candidate',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Browse Jobs',
      description: 'Find and apply to jobs',
      icon: FileText,
      href: '/jobs',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Profile',
      description: 'Update your profile',
      icon: Settings,
      href: '/dashboard/candidate/profile',
      color: 'bg-gray-100 text-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HireFlow Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {getRoleDisplayName(user.role)}
              </Badge>
              {user.company && (
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.company.name}</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isEmployerRole ? 'Manage Your Hiring Process' : 'Your Candidate Dashboard'}
          </h2>
          <p className="text-gray-600">
            {isEmployerRole 
              ? 'Streamline your hiring process with our comprehensive tools.'
              : 'Track your applications and complete assessments.'
            }
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(item.href)}
                  >
                    Open {item.title}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        {isEmployerRole && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-sm text-gray-600">Active Jobs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">48</p>
                      <p className="text-sm text-gray-600">Applications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <p className="text-sm text-gray-600">Assessments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-sm text-gray-600">Modules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
