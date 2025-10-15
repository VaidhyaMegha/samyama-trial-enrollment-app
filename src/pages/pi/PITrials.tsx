import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/services/api';
import { Loader2, Beaker, Download, Search, TrendingUp, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface Trial {
  id: string;
  title: string;
  identifier: string;
  enrolled: number;
  target: number;
  match_rate: number;
  pending: number;
}

export default function PITrials() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trialsData, isLoading } = useQuery({
    queryKey: ['pi', 'trials'],
    queryFn: async () => {
      const response = await adminAPI.getPITrials();
      return response.data;
    }
  });

  const handleExportCSV = async (trialId?: string) => {
    try {
      await adminAPI.exportEnrollmentSummary(trialId);
      toast.success('Report exported successfully');
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

  const trials = (trialsData || []) as Trial[];

  // Filter trials based on search query
  const filteredTrials = trials.filter(
    (trial) =>
      trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalEnrolled = trials.reduce((sum, trial) => sum + trial.enrolled, 0);
  const totalTarget = trials.reduce((sum, trial) => sum + trial.target, 0);
  const totalPending = trials.reduce((sum, trial) => sum + trial.pending, 0);
  const avgMatchRate = trials.length > 0
    ? Math.round(trials.reduce((sum, trial) => sum + trial.match_rate, 0) / trials.length)
    : 0;

  const summaryStats = [
    {
      label: 'Active Trials',
      value: trials.length.toString(),
      icon: Beaker,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Enrolled',
      value: `${totalEnrolled}/${totalTarget}`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Pending Review',
      value: totalPending.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Avg Match Rate',
      value: `${avgMatchRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Trials</h1>
          <p className="text-muted-foreground mt-2">
            Monitor enrollment progress across all clinical trials
          </p>
        </div>
        <Button variant="outline" onClick={() => handleExportCSV()}>
          <Download className="mr-2 h-4 w-4" />
          Export All Data
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat, index) => (
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
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search trials by name or identifier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Trials Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrials.map((trial, index) => {
          const enrollmentPercent = (trial.enrolled / trial.target) * 100;
          const isOnTrack = enrollmentPercent >= 50;
          const needsAttention = trial.pending > 5;

          return (
            <motion.div
              key={trial.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                onClick={() => navigate(`/pi/trials/${trial.id}`)}
              >
                {/* Status indicator */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    isOnTrack ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Beaker className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base leading-tight line-clamp-2">
                          {trial.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs mt-2">
                        {trial.identifier}
                      </CardDescription>
                    </div>
                    {needsAttention && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        Action Needed
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Enrollment Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Enrollment Progress
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {trial.enrolled}/{trial.target}
                      </Badge>
                    </div>
                    <Progress
                      value={enrollmentPercent}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrollmentPercent.toFixed(0)}% Complete
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-700 font-medium">Match Rate</p>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {trial.match_rate}%
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3 text-orange-600" />
                        <p className="text-xs text-orange-700 font-medium">Pending</p>
                      </div>
                      <p className="text-lg font-bold text-orange-700">
                        {trial.pending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State - No Trials */}
      {trials.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Beaker className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Trials Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              There are no active trials assigned to you at the moment. New trials will appear here once they are assigned.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Search Results */}
      {trials.length > 0 && filteredTrials.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Matching Trials</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No trials match your search query &quot;{searchQuery}&quot;. Try adjusting your search terms.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
