'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { jobsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  ArrowLeft, 
  Upload, 
  User, 
  Mail, 
  Phone,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Send,
  AlertCircle
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function JobApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    coverLetter: '',
    resume: null as File | null,
    fitQuestionnaire: {
      experience: '',
      motivation: '',
      availability: '',
      salary: '',
      startDate: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsAPI.getById(jobId),
    select: (data) => data.data,
    enabled: !!jobId
  })

  // Submit application mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => jobsAPI.apply(jobId, data),
    onSuccess: (response) => {
      toast.success('Application submitted successfully!')
      router.push('/dashboard/candidate')
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Failed to submit application')
      }
      console.error('Application error:', error)
    }
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required'
    }

    if (!formData.resume) {
      newErrors.resume = 'Resume is required'
    }

    // Validate fit questionnaire
    if (!formData.fitQuestionnaire.experience.trim()) {
      newErrors.experience = 'Please describe your relevant experience'
    }

    if (!formData.fitQuestionnaire.motivation.trim()) {
      newErrors.motivation = 'Please explain your motivation for this role'
    }

    if (!formData.fitQuestionnaire.availability.trim()) {
      newErrors.availability = 'Please specify your availability'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Create FormData for file upload
    const formDataToSend = new FormData()
    
    // Add basic fields
    formDataToSend.append('firstName', formData.firstName)
    formDataToSend.append('lastName', formData.lastName)
    formDataToSend.append('email', formData.email)
    formDataToSend.append('phone', formData.phone)
    formDataToSend.append('location', formData.location)
    formDataToSend.append('coverLetter', formData.coverLetter)
    formDataToSend.append('fitQuestionnaire', JSON.stringify(formData.fitQuestionnaire))
    
    // Add resume file if exists
    if (formData.resume) {
      formDataToSend.append('resume', formData.resume)
    }

    submitMutation.mutate(formDataToSend)
  }

  const handleInputChange = (field: string, value: string) => {
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

  const handleFitQuestionnaireChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      fitQuestionnaire: {
        ...prev.fitQuestionnaire,
        [field]: value
      }
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      if (!file.type.includes('pdf') && !file.type.includes('doc')) {
        toast.error('Please upload a PDF or Word document')
        return
      }
      setFormData(prev => ({
        ...prev,
        resume: file
      }))
      setErrors(prev => ({
        ...prev,
        resume: ''
      }))
    }
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => router.push('/jobs')} className="mt-4">
            Back to Jobs
          </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/jobs')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h1>
              <p className="text-sm text-gray-600">
                Submit your application for this position
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {job.company.name}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  
                  {job.salaryMin && job.salaryMax && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Posted {formatDate(job.createdAt)}</span>
                  </div>
                  
                  <Badge className="w-fit">
                    {job.type?.replace('_', ' ') || 'Full Time'}
                  </Badge>
                </div>

                {job.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {job.description}
                    </p>
                  </div>
                )}

                {job.requirements && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {job.requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Your basic contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                          placeholder="John"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                          placeholder="Doe"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`input ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="john.doe@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`input ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className={`input ${errors.location ? 'border-red-500' : ''}`}
                        placeholder="San Francisco, CA"
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resume Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resume</CardTitle>
                    <CardDescription>
                      Upload your resume (PDF or Word document, max 5MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {formData.resume ? formData.resume.name : 'Click to upload or drag and drop'}
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </label>
                      {errors.resume && (
                        <p className="text-red-500 text-sm mt-2">{errors.resume}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Letter */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cover Letter</CardTitle>
                    <CardDescription>
                      Tell us why you're interested in this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={formData.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      className={`textarea ${errors.coverLetter ? 'border-red-500' : ''}`}
                      rows={6}
                      placeholder="Explain why you're interested in this position and how your experience aligns with the role..."
                    />
                    {errors.coverLetter && (
                      <p className="text-red-500 text-sm mt-1">{errors.coverLetter}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Fit Questionnaire */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Questions</CardTitle>
                    <CardDescription>
                      Help us understand your fit for this role
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What relevant experience do you have for this position? *
                      </label>
                      <textarea
                        value={formData.fitQuestionnaire.experience}
                        onChange={(e) => handleFitQuestionnaireChange('experience', e.target.value)}
                        className={`textarea ${errors.experience ? 'border-red-500' : ''}`}
                        rows={3}
                        placeholder="Describe your relevant experience..."
                      />
                      {errors.experience && (
                        <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What motivates you to apply for this role? *
                      </label>
                      <textarea
                        value={formData.fitQuestionnaire.motivation}
                        onChange={(e) => handleFitQuestionnaireChange('motivation', e.target.value)}
                        className={`textarea ${errors.motivation ? 'border-red-500' : ''}`}
                        rows={3}
                        placeholder="Explain your motivation and interest in this position..."
                      />
                      {errors.motivation && (
                        <p className="text-red-500 text-sm mt-1">{errors.motivation}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What is your availability to start? *
                      </label>
                      <input
                        type="text"
                        value={formData.fitQuestionnaire.availability}
                        onChange={(e) => handleFitQuestionnaireChange('availability', e.target.value)}
                        className={`input ${errors.availability ? 'border-red-500' : ''}`}
                        placeholder="e.g., Immediately, 2 weeks notice, etc."
                      />
                      {errors.availability && (
                        <p className="text-red-500 text-sm mt-1">{errors.availability}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What are your salary expectations?
                      </label>
                      <input
                        type="text"
                        value={formData.fitQuestionnaire.salary}
                        onChange={(e) => handleFitQuestionnaireChange('salary', e.target.value)}
                        className="input"
                        placeholder="e.g., $80,000 - $100,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        When would you be available to start?
                      </label>
                      <input
                        type="date"
                        value={formData.fitQuestionnaire.startDate}
                        onChange={(e) => handleFitQuestionnaireChange('startDate', e.target.value)}
                        className="input"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {submitMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Application
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
