import { Users, UserCheck, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function PIDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Trials', value: '8', icon: Users, color: 'text-primary' },
    { label: 'Total Enrolled', value: '247', icon: UserCheck, color: 'text-success' },
    { label: 'Pending Review', value: '23', icon: Clock, color: 'text-warning' },
    { label: 'Match Rate', value: '78%', icon: TrendingUp, color: 'text-secondary' },
  ];

  const confidenceData = [
    { name: 'High (≥80%)', value: 156, color: 'hsl(var(--success))' },
    { name: 'Medium (50-79%)', value: 68, color: 'hsl(var(--warning))' },
    { name: 'Low (<50%)', value: 23, color: 'hsl(var(--destructive))' },
  ];

  const activeTrials = [
    {
      id: '1',
      title: 'Phase III Oncology Trial',
      identifier: 'ONCOLOGY-2024-001',
      enrolled: 45,
      target: 60,
      matchRate: 82,
    },
    {
      id: '2',
      title: 'Cardiovascular Study',
      identifier: 'CARDIO-2024-015',
      enrolled: 32,
      target: 50,
      matchRate: 75,
    },
    {
      id: '3',
      title: 'Neurology Research Protocol',
      identifier: 'NEURO-2024-008',
      enrolled: 28,
      target: 40,
      matchRate: 88,
    },
  ];

  const pendingReviews = [
    { id: '1', patient: 'PT-1234', protocol: 'ONCOLOGY-2024-001', confidence: 92, date: '2024-01-15' },
    { id: '2', patient: 'PT-5678', protocol: 'CARDIO-2024-015', confidence: 85, date: '2024-01-15' },
    { id: '3', patient: 'PT-9012', protocol: 'NEURO-2024-008', confidence: 78, date: '2024-01-14' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Principal Investigator Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor enrollment and review patient matches
          </p>
        </div>
        <Button onClick={() => navigate('/review')}>
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
            {pendingReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/review/${review.id}`)}
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
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
