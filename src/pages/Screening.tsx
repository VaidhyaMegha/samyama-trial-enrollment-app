import { useState } from 'react';
import { TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { matchesAPI } from '@/services/api';

export default function Screening() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stats = [
    { label: 'Total Protocols', value: '156', icon: Users, color: 'text-primary' },
    { label: 'Active Screenings', value: '324', icon: CheckCircle2, color: 'text-success' },
    { label: 'Pending Reviews', value: '42', icon: Clock, color: 'text-warning' },
    { label: 'Match Rate', value: '78%', icon: TrendingUp, color: 'text-secondary' },
  ];

  const screeningData = [
    { protocol: 'ONCO-001', current: 78, target: 150 },
    { protocol: 'CARD-015', current: 45, target: 100 },
    { protocol: 'NEUR-008', current: 23, target: 50 },
    { protocol: 'ONCO-012', current: 92, target: 120 },
  ];

  const trendData = [
    { month: 'Jan', screenings: 45 },
    { month: 'Feb', screenings: 52 },
    { month: 'Mar', screenings: 61 },
    { month: 'Apr', screenings: 73 },
    { month: 'May', screenings: 85 },
    { month: 'Jun', screenings: 108 },
  ];

  const distributionData = [
    { name: 'Oncology', value: 145, color: 'hsl(var(--primary))' },
    { name: 'Cardiology', value: 89, color: 'hsl(var(--secondary))' },
    { name: 'Neurology', value: 56, color: 'hsl(var(--accent))' },
    { name: 'Other', value: 34, color: 'hsl(var(--muted))' },
  ];

  useState(() => {
    const loadMatches = async () => {
      try {
        const response: any = await matchesAPI.getPending();
        setMatches(response.data);
      } catch (error) {
        toast.error('Failed to load matches');
      }
    };
    loadMatches();
  });

  const handleReviewMatch = (match: any) => {
    setSelectedMatch(match);
    setReviewNotes('');
    setIsDialogOpen(true);
  };

  const handleSubmitReview = async (action: 'approve' | 'reject') => {
    if (!selectedMatch) return;

    try {
      await matchesAPI.review(selectedMatch.id, action, reviewNotes);
      toast.success(`Match ${action}d successfully`);
      setMatches(matches.filter((m) => m.id !== selectedMatch.id));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to ${action} match`);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success text-success-foreground';
    if (confidence >= 50) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Screening Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor screening progress and review patient matches for screening visits
        </p>
      </div>

      {/* Regulatory Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900">
            ⚠️ <strong>Regulatory Notice:</strong> All approvals shown are based on preliminary AI matching analysis. 
            Final eligibility must be confirmed during the screening visit per protocol requirements and ICH-GCP guidelines. 
            Please recheck all inclusion/exclusion criteria at the screening visit.
          </p>
        </CardContent>
      </Card>

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

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Screening Progress by Protocol</CardTitle>
            <CardDescription>Current vs. target screening</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={screeningData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="protocol" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screening Trend</CardTitle>
            <CardDescription>Monthly screenings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="screenings" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Screening Distribution by Disease Type</CardTitle>
          <CardDescription>Total screened patients across disease categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Patient Match Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Match Review Queue</CardTitle>
          <CardDescription>
            Review and approve patient matches for screening
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pending matches
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">{match.patientId}</TableCell>
                      <TableCell>{match.protocolName}</TableCell>
                      <TableCell>
                        <Badge className={getConfidenceColor(match.matchScore)}>
                          {match.matchScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>{match.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{match.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewMatch(match)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Patient Match</DialogTitle>
            <DialogDescription>
              Assess the match quality and approve or reject for screening visit
            </DialogDescription>
          </DialogHeader>

          {/* Regulatory Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ <strong>Important:</strong> This approval is for screening only. Final eligibility confirmation is required at the screening visit per protocol requirements.
            </p>
          </div>

          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-accent/50">
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{selectedMatch.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Protocol</p>
                  <p className="font-medium">{selectedMatch.protocolName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Match Score</p>
                  <Badge className={getConfidenceColor(selectedMatch.matchScore)}>
                    {selectedMatch.matchScore}%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedMatch.date}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes</label>
                <Textarea
                  placeholder="Add any notes or comments about this match..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleSubmitReview('reject')}>
              Reject Match
            </Button>
            <Button onClick={() => handleSubmitReview('approve')}>
              Approve for Screening
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
