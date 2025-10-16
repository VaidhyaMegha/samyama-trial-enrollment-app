import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
      // Use dummy data as fallback
      setDashboardData({
        total_protocols: 10,
        active_protocols: 8,
        processing_protocols: 1,
        failed_protocols: 1,
        recent_activity: [
          { month: 'Jan', protocols: 2 },
          { month: 'Feb', protocols: 3 },
          { month: 'Mar', protocols: 1 },
          { month: 'Apr', protocols: 4 },
          { month: 'May', protocols: 5 },
          { month: 'Jun', protocols: 3 },
        ],
        recent_protocols: [
          {
            trial_id: 'DIABETES-SIMPLE-001',
            title: 'Type 2 Diabetes Management Study',
            upload_date: '2024-10-15',
            criteria_count: 5,
            status: 'completed'
          },
          {
            trial_id: 'HYPERTENSION-002',
            title: 'Hypertension Control Trial',
            upload_date: '2024-10-14',
            criteria_count: 4,
            status: 'completed'
          },
          {
            trial_id: 'LUNG-CANCER-003',
            title: 'Non-Small Cell Lung Cancer Study',
            upload_date: '2024-10-13',
            criteria_count: 6,
            status: 'completed'
          },
          {
            trial_id: 'HEART-FAILURE-004',
            title: 'Chronic Heart Failure Management',
            upload_date: '2024-10-12',
            criteria_count: 5,
            status: 'completed'
          },
          {
            trial_id: 'ASTHMA-005',
            title: 'Severe Asthma Biologic Therapy',
            upload_date: '2024-10-11',
            criteria_count: 5,
            status: 'processing'
          },
        ]
      });
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

  const processingData = dashboardData?.recent_activity && dashboardData.recent_activity.length > 0
    ? dashboardData.recent_activity
    : [
        { month: 'Jan', protocols: 2 },
        { month: 'Feb', protocols: 3 },
        { month: 'Mar', protocols: 1 },
        { month: 'Apr', protocols: 4 },
        { month: 'May', protocols: 5 },
        { month: 'Jun', protocols: 3 },
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

      {/* Protocol Status Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Status Distribution</CardTitle>
          <CardDescription>
            Current status breakdown of all protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Active', value: dashboardData?.active_protocols || 8, color: '#10b981' },
                  { name: 'Processing', value: dashboardData?.processing_protocols || 1, color: '#f59e0b' },
                  { name: 'Failed', value: dashboardData?.failed_protocols || 1, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Active', value: dashboardData?.active_protocols || 8, color: '#10b981' },
                  { name: 'Processing', value: dashboardData?.processing_protocols || 1, color: '#f59e0b' },
                  { name: 'Failed', value: dashboardData?.failed_protocols || 1, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Processing Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Processing Activity</CardTitle>
          <CardDescription>
            Monthly protocol processing over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar
                  dataKey="protocols"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
