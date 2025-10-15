import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { adminAPI } from '@/services/api';
import {
  Loader2,
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface Patient {
  patient_id: string;
  match_score: number;
  status: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export default function PITrialDetail() {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['pi', 'trial', trialId],
    queryFn: async () => {
      const response = await adminAPI.getPITrialDetails(trialId!);
      return response.data;
    },
    enabled: !!trialId
  });

  const handleExportCSV = async () => {
    try {
      await adminAPI.exportEnrollmentSummary(trialId);
      toast.success('Trial report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/pi/trials')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trials
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trial Not Found</h3>
            <p className="text-muted-foreground">
              The requested trial could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data from enrollment stats
  const chartData = [
    {
      name: 'Approved',
      value: data.enrollment?.approved || 0,
      color: 'hsl(142, 76%, 36%)',
      icon: CheckCircle2
    },
    {
      name: 'Pending PI',
      value: data.enrollment?.pending_pi_approval || 0,
      color: 'hsl(38, 92%, 50%)',
      icon: Clock
    },
    {
      name: 'Pending CRC',
      value: data.enrollment?.pending_crc || 0,
      color: 'hsl(221, 83%, 53%)',
      icon: Activity
    },
    {
      name: 'Rejected',
      value: data.enrollment?.rejected || 0,
      color: 'hsl(0, 84%, 60%)',
      icon: XCircle
    },
  ];

  const totalPatients = chartData.reduce((sum, item) => sum + item.value, 0);
  const enrollmentProgress = data.target ? (data.enrolled / data.target) * 100 : 0;

  // Stats for metric cards
  const stats = [
    {
      label: 'Total Patients',
      value: totalPatients.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      label: 'Enrolled',
      value: (data.enrollment?.approved || 0).toString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${enrollmentProgress.toFixed(0)}% of target`
    },
    {
      label: 'Pending Review',
      value: (data.enrollment?.pending_pi_approval || 0).toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: 'Requires action'
    },
    {
      label: 'Match Rate',
      value: `${data.match_rate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Success rate'
    },
  ];

  // Group patients by status
  const patientsByStatus = {
    approved: (data.patients || []).filter((p: Patient) => p.status === 'approved'),
    pending_pi_approval: (data.patients || []).filter((p: Patient) => p.status === 'pending_pi_approval'),
    pending_crc: (data.patients || []).filter((p: Patient) => p.status === 'pending_crc'),
    rejected: (data.patients || []).filter((p: Patient) => p.status === 'rejected'),
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      approved: { variant: 'default', label: 'Approved' },
      pending_pi_approval: { variant: 'secondary', label: 'Pending PI' },
      pending_crc: { variant: 'outline', label: 'Pending CRC' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="mb-2 -ml-4"
            onClick={() => navigate('/pi/trials')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trials
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <p>{data.identifier}</p>
          </div>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enrollment Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enrollment Progress</CardTitle>
              <CardDescription>
                Track progress toward enrollment target
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Target className="mr-2 h-4 w-4" />
              {data.enrolled}/{data.target}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={enrollmentProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{enrollmentProgress.toFixed(1)}% Complete</span>
              <span>{data.target - data.enrolled} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Funnel</CardTitle>
            <CardDescription>
              Breakdown of patient statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.value}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} patients`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Status Legend with Icons */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-semibold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Metrics</CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approval Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {data.match_rate || 0}%
                </span>
              </div>
              <Progress value={data.match_rate || 0} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Approved & Enrolled</span>
                </div>
                <span className="font-semibold">{data.enrollment?.approved || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Awaiting PI Approval</span>
                </div>
                <span className="font-semibold">{data.enrollment?.pending_pi_approval || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Pending CRC Review</span>
                </div>
                <span className="font-semibold">{data.enrollment?.pending_crc || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="font-semibold">{data.enrollment?.rejected || 0}</span>
              </div>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Matches</span>
                <span className="text-xl font-bold">{totalPatients}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Roster</CardTitle>
          <CardDescription>
            All patients matched to this trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Approved Patients */}
            {patientsByStatus.approved.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Enrolled Patients</h3>
                  <Badge variant="outline" className="ml-2">
                    {patientsByStatus.approved.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {patientsByStatus.approved.map((patient: Patient) => (
                    <div
                      key={patient.patient_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{patient.patient_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Match Score: {patient.match_score}% • Approved {new Date(patient.reviewed_at || patient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(patient.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending PI Approval */}
            {patientsByStatus.pending_pi_approval.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Pending Your Approval</h3>
                  <Badge variant="outline" className="ml-2">
                    {patientsByStatus.pending_pi_approval.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {patientsByStatus.pending_pi_approval.map((patient: Patient) => (
                    <div
                      key={patient.patient_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/review/${patient.patient_id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{patient.patient_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Match Score: {patient.match_score}% • Submitted {new Date(patient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(patient.status)}
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending CRC */}
            {patientsByStatus.pending_crc.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Pending CRC Review</h3>
                  <Badge variant="outline" className="ml-2">
                    {patientsByStatus.pending_crc.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {patientsByStatus.pending_crc.map((patient: Patient) => (
                    <div
                      key={patient.patient_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{patient.patient_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Match Score: {patient.match_score}% • Submitted {new Date(patient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(patient.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Patients */}
            {patientsByStatus.rejected.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold">Rejected</h3>
                  <Badge variant="outline" className="ml-2">
                    {patientsByStatus.rejected.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {patientsByStatus.rejected.map((patient: Patient) => (
                    <div
                      key={patient.patient_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 opacity-75"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{patient.patient_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Match Score: {patient.match_score}% • Rejected {new Date(patient.reviewed_at || patient.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(patient.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPatients === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Patients Yet</h3>
                <p className="text-muted-foreground">
                  No patients have been matched to this trial yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
