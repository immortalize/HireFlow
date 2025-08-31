'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { assessmentsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Search, 
  Filter, 
  Play, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  Award,
  Target
} from 'lucide-react';

interface Assessment {
  id: string;
  type: 'cognitive' | 'english' | 'sjt' | 'fit';
  title: string;
  description: string;
  questionsCount: number;
  timeLimit: number;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  score?: number;
  startedAt?: string;
  completedAt?: string;
  jobTitle: string;
  companyName: string;
}

export default function CandidateAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // This would typically fetch assessments assigned to the candidate
      const response = await assessmentsAPI.getAll({ candidateId: user.id });
      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'cognitive': return 'Cognitive Ability';
      case 'english': return 'English Proficiency';
      case 'sjt': return 'Situational Judgment';
      case 'fit': return 'Culture Fit';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cognitive': return 'bg-blue-100 text-blue-800';
      case 'english': return 'bg-green-100 text-green-800';
      case 'sjt': return 'bg-purple-100 text-purple-800';
      case 'fit': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assessment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: assessments.length,
    pending: assessments.filter(a => a.status === 'pending').length,
    inProgress: assessments.filter(a => a.status === 'in_progress').length,
    completed: assessments.filter(a => a.status === 'completed').length,
    averageScore: assessments.filter(a => a.status === 'completed' && a.score).length > 0 
      ? (assessments.filter(a => a.status === 'completed' && a.score)
         .reduce((sum, a) => sum + (a.score || 0), 0) / 
         assessments.filter(a => a.status === 'completed' && a.score).length).toFixed(1)
      : 0
  };

  const startAssessment = async (assessmentId: string) => {
    try {
      // Navigate to assessment taking page
      window.location.href = `/dashboard/candidate/assessments/take/${assessmentId}`;
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  };

  const viewResults = (assessmentId: string) => {
    window.location.href = `/dashboard/candidate/assessments/results/${assessmentId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Assessments</h1>
                <p className="text-sm text-gray-600">Complete assessments for your job applications</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search assessments or jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(assessment.type)}>
                      {getTypeDisplayName(assessment.type)}
                    </Badge>
                    <Badge className={getStatusColor(assessment.status)}>
                      {getStatusDisplayName(assessment.status)}
                    </Badge>
                  </div>
                  {assessment.status === 'completed' && (
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{assessment.score}%</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{assessment.title}</CardTitle>
                <CardDescription>{assessment.description}</CardDescription>
                <div className="text-sm text-gray-600">
                  <p><strong>Job:</strong> {assessment.jobTitle}</p>
                  <p><strong>Company:</strong> {assessment.companyName}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{assessment.questionsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-medium">{assessment.timeLimit} min</span>
                  </div>
                  {assessment.dueDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{new Date(assessment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {assessment.startedAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Started {new Date(assessment.startedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                  {assessment.status === 'pending' && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      onClick={() => startAssessment(assessment.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Assessment
                    </Button>
                  )}
                  {assessment.status === 'in_progress' && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                      onClick={() => startAssessment(assessment.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue
                    </Button>
                  )}
                  {assessment.status === 'completed' && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => viewResults(assessment.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAssessments.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any assessments assigned yet'
                }
              </p>
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
