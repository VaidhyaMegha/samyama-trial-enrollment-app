import { useState } from 'react';
import { Search, ClipboardCheck, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CRCDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const stats = [
    { label: 'Patients Screened', value: '247', icon: Users, color: 'text-primary' },
    { label: 'Active Matches', value: '42', icon: ClipboardCheck, color: 'text-success' },
    { label: 'Success Rate', value: '78%', icon: TrendingUp, color: 'text-secondary' },
  ];

  const recentMatches = [
    { id: '1', protocol: 'ONCOLOGY-2024-001', patient: 'PT-1234', confidence: 92, status: 'approved' },
    { id: '2', protocol: 'CARDIO-2024-015', patient: 'PT-5678', confidence: 85, status: 'pending' },
    { id: '3', protocol: 'NEURO-2024-008', patient: 'PT-9012', confidence: 67, status: 'pending' },
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success text-success-foreground';
    if (confidence >= 50) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, Clinical Research Coordinator</h1>
        <p className="text-muted-foreground mt-2">
          Find eligible patients and manage trial enrollments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* Protocol Search */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Search</CardTitle>
          <CardDescription>
            Search for protocols to check patient eligibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter protocol ID or search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/eligibility-check')}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Start New Eligibility Check
          </Button>
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patient Matches</CardTitle>
          <CardDescription>
            Latest eligibility assessments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{match.protocol}</p>
                    <Badge variant="outline" className="text-xs">
                      {match.patient}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confidence Score: {match.confidence}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getConfidenceColor(match.confidence)}>
                    {match.confidence}%
                  </Badge>
                  <Badge variant={match.status === 'approved' ? 'default' : 'secondary'}>
                    {match.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
