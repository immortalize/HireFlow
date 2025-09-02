'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { assessmentsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Clock, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Question {
  id: string
  text: string
  type: 'multiple_choice'
  options: string[]
  correctAnswer?: number
  category: 'logic' | 'math' | 'verbal'
}

interface Assessment {
  id: string
  type: string
  timeLimit: number
  questions: Question[]
  status: string
  application: {
    job: {
      title: string
      company: {
        name: string
      }
    }
  }
}

interface ProctoringSnapshot {
  timestamp: string
  imageData: string
  userAgent: string
  screenResolution: string
}

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [proctoringData, setProctoringData] = useState<ProctoringSnapshot[]>([])
  const [showWarning, setShowWarning] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const proctoringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch assessment data
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsAPI.getAssessment(assessmentId),
    select: (data) => data.data,
    enabled: !!assessmentId
  })

interface AssessmentResults {
  answers: Record<string, number>
  timeSpent: number
  proctoringData: ProctoringSnapshot[]
  completedAt: string
}

  // Submit assessment results
  const submitMutation = useMutation({
    mutationFn: (data: AssessmentResults) => assessmentsAPI.submitResults(assessmentId, data),
    onSuccess: () => {
      toast.success('Assessment submitted successfully!')
      setIsCompleted(true)
    },
    onError: (error) => {
      toast.error('Failed to submit assessment')
      console.error('Submit error:', error)
    }
  })

  // Initialize assessment
  useEffect(() => {
    if (assessment) {
      setTimeRemaining(assessment.timeLimit * 60) // Convert to seconds
    }
  }, [assessment])

  // Timer countdown
  useEffect(() => {
    if (isStarted && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isStarted, isPaused, timeRemaining])

  // Proctoring setup
  useEffect(() => {
    if (isStarted && !isPaused) {
      startProctoring()
    } else {
      stopProctoring()
    }

    return () => {
      stopProctoring()
    }
  }, [isStarted, isPaused])

  const startProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Capture snapshots every 30 seconds
      proctoringIntervalRef.current = setInterval(() => {
        captureSnapshot()
      }, 30000)
    } catch (error) {
      console.warn('Camera access denied:', error)
      toast.error('Camera access is required for proctoring')
    }
  }

  const stopProctoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (proctoringIntervalRef.current) {
      clearInterval(proctoringIntervalRef.current)
    }
  }

  const captureSnapshot = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        
        setProctoringData(prev => [...prev, {
          timestamp: new Date().toISOString(),
          imageData,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`
        }])
      }
    }
  }

  const handleStart = () => {
    setIsStarted(true)
    setIsPaused(false)
    toast.success('Assessment started! Good luck!')
  }

  const handlePause = () => {
    setIsPaused(true)
    toast('Assessment paused', {
      icon: '⏸️',
      duration: 3000
    })
  }

  const handleResume = () => {
    setIsPaused(false)
    toast.success('Assessment resumed')
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < (assessment?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    if (!assessment) return

    const results = {
      answers,
      timeSpent: assessment.timeLimit * 60 - timeRemaining,
      proctoringData,
      completedAt: new Date().toISOString()
    }

    submitMutation.mutate(results)
  }

  const handleLeavePage = (e: BeforeUnloadEvent) => {
    if (isStarted && !isCompleted) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  useEffect(() => {
    window.addEventListener('beforeunload', handleLeavePage)
    return () => window.removeEventListener('beforeunload', handleLeavePage)
  }, [isStarted, isCompleted])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Assessment not found</p>
          <Button onClick={() => router.push('/dashboard/candidate')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the assessment. Your results will be reviewed shortly.
          </p>
          <Button onClick={() => router.push('/dashboard/candidate')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = assessment.questions?.[currentQuestionIndex]
  const totalQuestions = assessment.questions?.length || 0
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {assessment.application.job.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {assessment.application.job.company.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isStarted && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              
              {isStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPaused ? handleResume : handlePause}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Warning */}
      {showWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please stay in the assessment window. Leaving may result in disqualification.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isStarted ? (
          /* Pre-assessment Instructions */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Assessment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">About This Assessment</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• This is a {assessment.type.replace('_', ' ')} assessment</li>
                  <li>• {totalQuestions} questions to complete</li>
                  <li>• Time limit: {assessment.timeLimit} minutes</li>
                  <li>• Questions are randomized and timed</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Important Guidelines</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet environment with minimal distractions</li>
                  <li>• Have your camera ready for proctoring</li>
                  <li>• Do not leave the assessment window</li>
                  <li>• Do not use external resources or calculators</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Proctoring Notice</h4>
                <p className="text-sm text-blue-700">
                  This assessment uses webcam proctoring to ensure academic integrity. 
                  Your camera will be activated when you start the assessment.
                </p>
              </div>

              <Button 
                onClick={handleStart}
                className="w-full"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Assessment Interface */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {currentQuestion?.category} • Multiple Choice
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentQuestion?.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-lg text-gray-900 leading-relaxed">
                    {currentQuestion?.text}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion?.options?.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        answers[currentQuestion.id] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                          answers[currentQuestion.id] === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion.id] === index && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(0)}
                  disabled={currentQuestionIndex === 0}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < totalQuestions}
                  >
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Video Element for Proctoring */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        style={{ width: '1px', height: '1px' }}
      />
    </div>
  )
}
