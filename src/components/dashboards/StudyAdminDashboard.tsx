import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';

export function StudyAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = dashboardData ? [
    { label: 'Total Protocols', value: dashboardData.total_protocols?.toString() || '0', icon: FileText, color: 'text-primary' },
    { label: 'Active Protocols', value: dashboardData.active_protocols?.toString() || '0', icon: CheckCircle, color: 'text-success' },
    { label: 'Processing', value: dashboardData.processing_protocols?.toString() || '0', icon: Clock, color: 'text-warning' },
    { label: 'Failed', value: dashboardData.failed_protocols?.toString() || '0', icon: AlertCircle, color: 'text-destructive' },
  ] : [
    { label: 'Total Protocols', value: '0', icon: FileText, color: 'text-primary' },
    { label: 'Active Protocols', value: '0', icon: CheckCircle, color: 'text-success' },
    { label: 'Processing', value: '0', icon: Clock, color: 'text-warning' },
    { label: 'Failed', value: '0', icon: AlertCircle, color: 'text-destructive' },
  ];

  const processingData = dashboardData?.recent_activity || [
    { month: 'Jan', protocols: 0 },
    { month: 'Feb', protocols: 0 },
    { month: 'Mar', protocols: 0 },
    { month: 'Apr', protocols: 0 },
    { month: 'May', protocols: 0 },
    { month: 'Jun', protocols: 0 },
  ];

  const recentProtocols = dashboardData?.recent_protocols || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: 'default', label: 'Completed' },
      processing: { variant: 'secondary', label: 'Processing' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || variants.completed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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
          {recentProtocols.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No protocols found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProtocols.map((protocol: any) => (
                <div
                  key={protocol.trial_id || protocol.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/protocols`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{protocol.title || protocol.trial_id}</p>
                      <Badge variant="outline" className="text-xs">
                        {protocol.trial_id || protocol.identifier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {protocol.upload_date || protocol.uploadedAt || 'N/A'} •
                      {protocol.criteria_count > 0 ? ` ${protocol.criteria_count} criteria` : ' Processing'}
                    </p>
                  </div>
                  {getStatusBadge(protocol.status || 'completed')}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
