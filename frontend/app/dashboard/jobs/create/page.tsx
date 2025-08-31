'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { jobsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  MapPin,
  DollarSign,
  Clock,
  Users,
  Building,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full_time',
    salaryMin: '',
    salaryMax: '',
    requirements: '',
    benefits: '',
    isActive: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => jobsAPI.create(data),
    onSuccess: (response) => {
      toast.success('Job created successfully!')
      router.push('/dashboard/jobs')
    },
    onError: (error) => {
      toast.error('Failed to create job')
      console.error('Create error:', error)
    }
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (formData.salaryMin && formData.salaryMax) {
      const min = parseInt(formData.salaryMin)
      const max = parseInt(formData.salaryMax)
      if (min > max) {
        newErrors.salaryMax = 'Maximum salary must be greater than minimum salary'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const jobData = {
      ...formData,
      salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
      salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null
    }

    createMutation.mutate(jobData)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const getJobTypeColor = (type: string) => {
    const colors = {
      full_time: 'bg-blue-100 text-blue-800',
      part_time: 'bg-green-100 text-green-800',
      contract: 'bg-purple-100 text-purple-800',
      internship: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
                onClick={() => router.push('/dashboard/jobs')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Job Posting</h1>
                <p className="text-sm text-gray-600">
                  Create a new job posting for your company
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Job Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                  <CardDescription>
                    Basic information about the position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`input ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="e.g., Senior Software Engineer"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`textarea ${errors.description ? 'border-red-500' : ''}`}
                      rows={6}
                      placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      className="textarea"
                      rows={4}
                      placeholder="List the skills, experience, and qualifications required for this position..."
                    />
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefits & Perks
                    </label>
                    <textarea
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      className="textarea"
                      rows={3}
                      placeholder="Describe the benefits, perks, and advantages of working at your company..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Configuration</CardTitle>
                  <CardDescription>
                    Set job type, location, and compensation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['full_time', 'part_time', 'contract', 'internship'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleInputChange('type', type)}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                            formData.type === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={`input ${errors.location ? 'border-red-500' : ''}`}
                      placeholder="e.g., San Francisco, CA or Remote"
                    />
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                    )}
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Range (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                          className="input"
                          placeholder="Min"
                          min="0"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                          className={`input ${errors.salaryMax ? 'border-red-500' : ''}`}
                          placeholder="Max"
                          min="0"
                        />
                      </div>
                    </div>
                    {errors.salaryMax && (
                      <p className="text-red-500 text-sm mt-1">{errors.salaryMax}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active Job Posting
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Active jobs are visible to candidates
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Job Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Preview</CardTitle>
                  <CardDescription>
                    How your job will appear to candidates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {formData.title || 'Job Title'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formData.location || 'Location'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getJobTypeColor(formData.type)}>
                          {formData.type.replace('_', ' ')}
                        </Badge>
                        {formData.salaryMin && formData.salaryMax && (
                          <Badge className="bg-green-100 text-green-800">
                            ${formData.salaryMin.toLocaleString()} - ${formData.salaryMax.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formData.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {formData.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Job Posting
              </Button>
            </div>
          </div>
        </form>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              Tips for Creating Effective Job Postings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Writing Job Descriptions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be specific about responsibilities and expectations</li>
                  <li>• Use clear, action-oriented language</li>
                  <li>• Include both required and preferred qualifications</li>
                  <li>• Highlight company culture and values</li>
                  <li>• Mention growth opportunities and benefits</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Setting Compensation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Research market rates for similar positions</li>
                  <li>• Consider experience level and location</li>
                  <li>• Include benefits and perks in total compensation</li>
                  <li>• Be transparent about salary ranges</li>
                  <li>• Consider equity or performance bonuses</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
