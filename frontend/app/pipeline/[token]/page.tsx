'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { pipelinesAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  Timer,
  User,
  Mail
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Candidate {
  id: string
  email: string
  firstName: string
  lastName: string
  status: string
  startedAt: string
  completedAt?: string
  results: AssessmentResult[]
}

interface AssessmentResult {
  assessmentId: string
  score: number
  completedAt: string
}

interface Assessment {
  id: string
  type: string
  order: number
  timeLimit: number
  isRequired: boolean
  questionsBank: QuestionBank
}

interface QuestionBank {
  id: string
  name: string
  questions: Question[]
}

interface Question {
  id: string
  text: string
  type: string
  options: string[]
}

interface Pipeline {
  id: string
  name: string
  description: string
  token: string
  expiresAt?: string
  company: {
    name: string
    logo?: string
  }
  assessments: Assessment[]
}

interface StartPipelineData {
  firstName: string
  lastName: string
  email: string
}

interface SubmitAssessmentData {
  answers: number[]
  timeSpent: number
}

export default function PipelinePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [currentStep, setCurrentStep] = useState<'welcome' | 'register' | 'assessment' | 'complete'>('welcome')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Fetch pipeline
  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline', token],
    queryFn: () => pipelinesAPI.getByToken(token),
    select: (data) => data.data?.pipeline,
    enabled: !!token
  })

  // Start pipeline mutation
  const startMutation = useMutation({
    mutationFn: (data: StartPipelineData) => pipelinesAPI.startPipeline(token, data),
    onSuccess: (response) => {
      setCandidate(response.data.candidate)
      setCurrentStep('assessment')
      toast.success('Pipeline started successfully!')
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Failed to start pipeline')
      }
    }
  })

  // Submit assessment mutation
  const submitMutation = useMutation({
    mutationFn: (data: SubmitAssessmentData) => 
      pipelinesAPI.submitAssessment(token, currentAssessment?.id || '', data),
    onSuccess: (response) => {
      const isCompleted = response.data.result.isCompleted
      if (isCompleted) {
        setCurrentStep('complete')
        toast.success('All assessments completed!')
      } else {
        setCurrentAssessmentIndex(prev => prev + 1)
        setAnswers([])
        toast.success('Assessment submitted successfully!')
      }
    },
    onError: (error: any) => {
      toast.error('Failed to submit assessment')
    }
  })

  const currentAssessment = pipeline?.assessments[currentAssessmentIndex]

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      handleSubmitAssessment()
    }
  }, [timeLeft, isTimerRunning])

  // Start timer when assessment begins
  useEffect(() => {
    if (currentAssessment && currentStep === 'assessment') {
      setTimeLeft(currentAssessment.timeLimit * 60)
      setIsTimerRunning(true)
    }
  }, [currentAssessment, currentStep])

  const handleStartPipeline = (formData: any) => {
    startMutation.mutate(formData)
  }

  const handleSubmitAssessment = () => {
    if (!candidate || !currentAssessment) return

    const timeSpent = (currentAssessment.timeLimit * 60) - timeLeft
    submitMutation.mutate({
      candidateId: candidate.id,
      answers,
      timeSpent
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAssessmentTypeInfo = (type: string) => {
    switch (type) {
      case 'COGNITIVE':
        return {
          name: 'Cognitive Ability',
          description: 'Tests logical reasoning, mathematical ability, and verbal comprehension',
          icon: Brain,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'ENGLISH':
        return {
          name: 'English Proficiency',
          description: 'Assesses English language proficiency and communication skills',
          icon: FileText,
          color: 'bg-green-100 text-green-800'
        }
      case 'SITUATIONAL_JUDGMENT':
        return {
          name: 'Situational Judgment',
          description: 'Evaluates decision-making in workplace scenarios',
          icon: Users,
          color: 'bg-purple-100 text-purple-800'
        }
      case 'FIT_CHECK':
        return {
          name: 'Cultural Fit',
          description: 'Determines cultural fit and work preferences',
          icon: Users,
          color: 'bg-orange-100 text-orange-800'
        }
      default:
        return {
          name: 'Assessment',
          description: 'General assessment',
          icon: Brain,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  if (pipelineLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline Not Found</h3>
          <p className="text-gray-600">This pipeline may have expired or been removed.</p>
        </div>
      </div>
    )
  }

  const typeInfo = getAssessmentTypeInfo(currentAssessment?.type || '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {pipeline.company.logo && (
                <img 
                  src={pipeline.company.logo} 
                  alt={pipeline.company.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{pipeline.name}</h1>
                <p className="text-sm text-gray-600">{pipeline.company.name}</p>
              </div>
            </div>
            {currentStep === 'assessment' && (
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-red-500" />
                <span className="font-mono text-lg font-bold text-red-600">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{pipeline.name}</CardTitle>
              <CardDescription className="text-lg">
                {pipeline.description || 'Welcome to this assessment pipeline'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  This pipeline contains {pipeline.assessments.length} assessment(s) to evaluate your skills and fit.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {pipeline.assessments.map((assessment: Assessment, index: number) => {
                    const Icon = typeInfo.icon
                    return (
                      <div key={assessment.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {getAssessmentTypeInfo(assessment.type).name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {assessment.timeLimit} minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button 
                  onClick={() => setCurrentStep('register')}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Please provide your information to begin the assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm onSubmit={handleStartPipeline} />
            </CardContent>
          </Card>
        )}

        {currentStep === 'assessment' && currentAssessment && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Assessment {currentAssessmentIndex + 1} of {pipeline.assessments.length}</span>
                <Badge className={typeInfo.color}>
                  {typeInfo.name}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-red-500" />
                <span className="font-mono text-sm font-bold text-red-600">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Assessment */}
            <AssessmentComponent 
              assessment={currentAssessment}
              answers={answers}
              setAnswers={setAnswers}
              onSubmit={handleSubmitAssessment}
              isSubmitting={submitMutation.isPending}
            />
          </div>
        )}

        {currentStep === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
              <CardDescription>
                Thank you for completing all assessments in this pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Your results have been submitted and will be reviewed by the hiring team.
                You will be contacted if you are selected for the next stage.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your results will be reviewed by the hiring team</li>
                  <li>• You may be contacted for additional interviews</li>
                  <li>• Keep an eye on your email for updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Registration Form Component
function RegistrationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
          Email Address *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`input ${errors.email ? 'border-red-500' : ''}`}
          placeholder="john.doe@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        <Play className="w-4 h-4 mr-2" />
        Start Assessment
      </Button>
    </form>
  )
}

// Assessment Component
function AssessmentComponent({ 
  assessment, 
  answers, 
  setAnswers, 
  onSubmit, 
  isSubmitting 
}: {
  assessment: Assessment
  answers: number[]
  setAnswers: (answers: number[]) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const questions = assessment.questionsBank?.questions || []

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {questions.map((question: any, questionIndex: number) => (
            <div key={question.id || questionIndex} className="border-b pb-6 last:border-b-0">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Question {questionIndex + 1}
              </h3>
              <p className="text-gray-700 mb-4">{question.question}</p>
              
              <div className="space-y-2">
                {question.options.map((option: string, optionIndex: number) => (
                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${questionIndex}`}
                      value={optionIndex}
                      checked={answers[questionIndex] === optionIndex}
                      onChange={() => handleAnswerChange(questionIndex, optionIndex)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting || answers.length !== questions.length}
            size="lg"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Submit Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
