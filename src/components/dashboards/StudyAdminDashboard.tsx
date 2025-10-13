import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StudyAdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Protocols', value: '156', icon: FileText, color: 'text-primary' },
    { label: 'Active Protocols', value: '94', icon: CheckCircle, color: 'text-success' },
    { label: 'Processing', value: '12', icon: Clock, color: 'text-warning' },
    { label: 'Failed', value: '3', icon: AlertCircle, color: 'text-destructive' },
  ];

  const processingData = [
    { month: 'Jan', protocols: 12 },
    { month: 'Feb', protocols: 19 },
    { month: 'Mar', protocols: 15 },
    { month: 'Apr', protocols: 23 },
    { month: 'May', protocols: 18 },
    { month: 'Jun', protocols: 25 },
  ];

  const recentProtocols = [
    { 
      id: '1', 
      title: 'Phase III Oncology Trial', 
      identifier: 'ONCOLOGY-2024-001',
      status: 'completed',
      uploadedAt: '2024-01-15',
      criteriaCount: 34
    },
    { 
      id: '2', 
      title: 'Cardiovascular Study', 
      identifier: 'CARDIO-2024-015',
      status: 'processing',
      uploadedAt: '2024-01-14',
      criteriaCount: 0
    },
    { 
      id: '3', 
      title: 'Neurology Research Protocol', 
      identifier: 'NEURO-2024-008',
      status: 'completed',
      uploadedAt: '2024-01-13',
      criteriaCount: 28
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: 'default', label: 'Completed' },
      processing: { variant: 'secondary', label: 'Processing' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || variants.completed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocol Management</h1>
          <p className="text-muted-foreground mt-2">
            Upload, process, and manage clinical trial protocols
          </p>
        </div>
        <Button onClick={() => navigate('/protocols')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Protocol
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

      {/* Processing Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Processing Activity</CardTitle>
          <CardDescription>
            Monthly protocol processing over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="protocols" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Protocols */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Protocols</CardTitle>
          <CardDescription>
            Latest uploaded and processed protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProtocols.map((protocol) => (
              <div
                key={protocol.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/protocols/${protocol.id}`)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{protocol.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {protocol.identifier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {protocol.uploadedAt} • {protocol.criteriaCount > 0 ? `${protocol.criteriaCount} criteria` : 'Processing'}
                  </p>
                </div>
                {getStatusBadge(protocol.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
