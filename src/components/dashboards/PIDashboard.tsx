import { Users, UserCheck, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, matchesAPI } from '@/services/api';

export function PIDashboard() {
  const navigate = useNavigate();

  // Fetch real data from backend
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['pi', 'dashboard'],
    queryFn: async () => {
      const response = await adminAPI.getPIDashboard();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch trials for the active trials section
  const { data: trialsData } = useQuery({
    queryKey: ['pi', 'trials'],
    queryFn: async () => {
      const response = await adminAPI.getPITrials();
      return response.data;
    },
  });

  // Fetch all matches to calculate confidence distribution
  const { data: allMatchesData } = useQuery({
    queryKey: ['matches', 'all'],
    queryFn: async () => {
      const response = await matchesAPI.getAll();
      return response.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use real data from API
  const stats = [
    {
      label: 'Active Trials',
      value: dashboardData?.metrics?.active_trials?.toString() || '0',
      icon: Users,
      color: 'text-primary'
    },
    {
      label: 'Total Enrolled',
      value: dashboardData?.metrics?.total_enrolled?.toString() || '0',
      icon: UserCheck,
      color: 'text-success'
    },
    {
      label: 'Pending Review',
      value: dashboardData?.metrics?.pending_pi_approval?.toString() || '0',
      icon: Clock,
      color: 'text-warning'
    },
    {
      label: 'Match Rate',
      value: `${dashboardData?.metrics?.match_rate || 0}%`,
      icon: TrendingUp,
      color: 'text-secondary'
    },
  ];

  // Calculate real confidence distribution from all matches
  const calculateConfidenceDistribution = () => {
    if (!allMatchesData || allMatchesData.length === 0) {
      return [
        { name: 'High (≥80%)', value: 0, color: 'hsl(var(--success))' },
        { name: 'Medium (50-79%)', value: 0, color: 'hsl(var(--warning))' },
        { name: 'Low (<50%)', value: 0, color: 'hsl(var(--destructive))' },
      ];
    }

    const high = allMatchesData.filter((m: any) => m.match_score >= 80).length;
    const medium = allMatchesData.filter((m: any) => m.match_score >= 50 && m.match_score < 80).length;
    const low = allMatchesData.filter((m: any) => m.match_score < 50).length;

    return [
      { name: 'High (≥80%)', value: high, color: 'hsl(var(--success))' },
      { name: 'Medium (50-79%)', value: medium, color: 'hsl(var(--warning))' },
      { name: 'Low (<50%)', value: low, color: 'hsl(var(--destructive))' },
    ];
  };

  const confidenceData = calculateConfidenceDistribution();

  // Use real trials data (top 3)
  const activeTrials = (trialsData || []).slice(0, 3);

  // Use real pending reviews
  const pendingReviews = dashboardData?.pending_reviews || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Principal Investigator Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor enrollment and review patient matches
          </p>
        </div>
        <Button onClick={() => navigate('/matches')}>
          <UserCheck className="mr-2 h-4 w-4" />
          Review Matches
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
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
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Match Confidence Distribution</CardTitle>
            <CardDescription>
              Breakdown of patient matches by confidence level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={confidenceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {confidenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Trials */}
        <Card>
          <CardHeader>
            <CardTitle>Active Trial Enrollment</CardTitle>
            <CardDescription>
              Current enrollment status for active trials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeTrials.map((trial) => (
                <div key={trial.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{trial.title}</p>
                      <p className="text-xs text-muted-foreground">{trial.identifier}</p>
                    </div>
                    <Badge variant="outline">
                      {trial.enrolled}/{trial.target}
                    </Badge>
                  </div>
                  <Progress value={(trial.enrolled / trial.target) * 100} />
                  <p className="text-xs text-muted-foreground">
                    Match rate: {trial.matchRate}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Match Reviews</CardTitle>
          <CardDescription>
            Patient matches waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reviews</p>
              </div>
            ) : (
              pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/matches')}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{review.patient}</p>
                      <Badge variant="outline" className="text-xs">
                        {review.protocol}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {review.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-success text-success-foreground">
                      {review.confidence}%
                    </Badge>
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      navigate('/matches');
                    }}>
                      Review
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
