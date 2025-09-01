'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { pipelinesAPI } from '@/lib/api'
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
  Link,
  Copy,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Assessment {
  type: string
  timeLimit: number
  isRequired: boolean
}

export default function CreatePipelinePage() {
  const router = useRouter()
  const [pipelineData, setPipelineData] = useState({
    name: '',
    description: '',
    assessments: [] as Assessment[],
    expiresAt: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Create pipeline mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => pipelinesAPI.create(data),
    onSuccess: (response) => {
      toast.success('Hiring pipeline created successfully!')
      router.push('/dashboard/pipelines')
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Failed to create pipeline')
      }
      console.error('Create error:', error)
    }
  })

  const assessmentTypes = [
    {
      type: 'COGNITIVE',
      name: 'Cognitive Ability',
      description: 'Tests logical reasoning, mathematical ability, and verbal comprehension',
      icon: Brain,
      color: 'bg-blue-100 text-blue-800',
      defaultTime: 30
    },
    {
      type: 'ENGLISH',
      name: 'English Proficiency',
      description: 'Assesses English language proficiency and communication skills',
      icon: FileText,
      color: 'bg-green-100 text-green-800',
      defaultTime: 20
    },
    {
      type: 'SITUATIONAL_JUDGMENT',
      name: 'Situational Judgment',
      description: 'Evaluates decision-making in workplace scenarios',
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
      defaultTime: 15
    },
    {
      type: 'FIT_CHECK',
      name: 'Cultural Fit',
      description: 'Determines cultural fit and work preferences',
      icon: Users,
      color: 'bg-orange-100 text-orange-800',
      defaultTime: 10
    }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!pipelineData.name.trim()) {
      newErrors.name = 'Pipeline name is required'
    }

    if (pipelineData.assessments.length === 0) {
      newErrors.assessments = 'At least one assessment is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    createMutation.mutate(pipelineData)
  }

  const addAssessment = (type: string) => {
    const assessmentType = assessmentTypes.find(at => at.type === type)
    if (assessmentType) {
      setPipelineData(prev => ({
        ...prev,
        assessments: [
          ...prev.assessments,
          {
            type,
            timeLimit: assessmentType.defaultTime,
            isRequired: true
          }
        ]
      }))
    }
  }

  const removeAssessment = (index: number) => {
    setPipelineData(prev => ({
      ...prev,
      assessments: prev.assessments.filter((_, i) => i !== index)
    }))
  }

  const updateAssessment = (index: number, field: keyof Assessment, value: any) => {
    setPipelineData(prev => ({
      ...prev,
      assessments: prev.assessments.map((assessment, i) => 
        i === index ? { ...assessment, [field]: value } : assessment
      )
    }))
  }

  const getAssessmentTypeInfo = (type: string) => {
    return assessmentTypes.find(at => at.type === type) || assessmentTypes[0]
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Hiring Pipeline</h1>
                <p className="text-sm text-gray-600">
                  Build a custom assessment pipeline to share with candidates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pipeline Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Details</CardTitle>
                  <CardDescription>
                    Basic information about your hiring pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pipeline Name *
                    </label>
                    <input
                      type="text"
                      value={pipelineData.name}
                      onChange={(e) => setPipelineData(prev => ({ ...prev, name: e.target.value }))}
                      className={`input ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., Software Engineer Assessment"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={pipelineData.description}
                      onChange={(e) => setPipelineData(prev => ({ ...prev, description: e.target.value }))}
                      className="textarea"
                      rows={3}
                      placeholder="Describe what this pipeline assesses..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={pipelineData.expiresAt}
                      onChange={(e) => setPipelineData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for no expiration
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>
                    Select the assessments to include in your pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pipelineData.assessments.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments added</h3>
                      <p className="text-gray-600 mb-4">
                        Add assessments to create your pipeline
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pipelineData.assessments.map((assessment, index) => {
                        const typeInfo = getAssessmentTypeInfo(assessment.type)
                        const Icon = typeInfo.icon
                        
                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{typeInfo.name}</h4>
                                  <p className="text-sm text-gray-600">{typeInfo.description}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAssessment(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Time Limit (minutes)
                                </label>
                                <input
                                  type="number"
                                  value={assessment.timeLimit}
                                  onChange={(e) => updateAssessment(index, 'timeLimit', parseInt(e.target.value))}
                                  className="input"
                                  min="5"
                                  max="180"
                                />
                              </div>
                              <div className="flex items-center">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={assessment.isRequired}
                                    onChange={(e) => updateAssessment(index, 'isRequired', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Required
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {errors.assessments && (
                    <p className="text-red-500 text-sm">{errors.assessments}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assessment Types */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Assessments</CardTitle>
                  <CardDescription>
                    Choose from available assessment types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assessmentTypes.map((type) => {
                    const Icon = type.icon
                    const isAdded = pipelineData.assessments.some(a => a.type === type.type)
                    
                    return (
                      <div key={type.type} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${type.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{type.name}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          {isAdded ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Added
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAssessment(type.type)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Assessment
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Pipeline Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Preview</CardTitle>
                  <CardDescription>
                    How your pipeline will appear to candidates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {pipelineData.name || 'Pipeline Name'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {pipelineData.description || 'No description'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Assessments:</h5>
                    {pipelineData.assessments.length === 0 ? (
                      <p className="text-sm text-gray-500">No assessments added</p>
                    ) : (
                      <div className="space-y-1">
                        {pipelineData.assessments.map((assessment, index) => {
                          const typeInfo = getAssessmentTypeInfo(assessment.type)
                          return (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{typeInfo.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">{assessment.timeLimit}m</span>
                                {assessment.isRequired && (
                                  <Badge className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
                  <Link className="w-4 h-4 mr-2" />
                )}
                Create Pipeline
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
