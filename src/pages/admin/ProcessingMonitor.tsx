import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import { Activity, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProcessingMonitor() {
  const [loading, setLoading] = useState(true);
  const [processingData, setProcessingData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProcessingStatus();
  }, []);

  const fetchProcessingStatus = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProcessingStatus();
      setProcessingData(response.data);
    } catch (error: any) {
      console.error('Error fetching processing status:', error);
      toast.error('Failed to load processing status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProcessingStatus();
  };

  const handleReprocess = async (trialId: string) => {
    try {
      await adminAPI.reprocessProtocol(trialId);
      toast.success('Protocol reprocessing initiated');
      fetchProcessingStatus();
    } catch (error: any) {
      console.error('Error reprocessing protocol:', error);
      toast.error(error.response?.data?.error || 'Failed to reprocess protocol');
    }
  };

  const handleDelete = async (trialId: string) => {
    if (!confirm(`Are you sure you want to delete protocol ${trialId}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteProtocol(trialId);
      toast.success('Protocol deleted successfully');
      fetchProcessingStatus();
    } catch (error: any) {
      console.error('Error deleting protocol:', error);
      toast.error(error.response?.data?.error || 'Failed to delete protocol');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
      processing: { variant: 'secondary', icon: Clock, label: 'Processing' },
      failed: { variant: 'destructive', icon: AlertCircle, label: 'Failed' },
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
    };
    const config = variants[status] || variants.completed;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading processing status...</p>
        </div>
      </div>
    );
  }

  const protocols = processingData?.protocols || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processing Pipeline Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Monitor protocol processing status and manage failed jobs
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Total Protocols',
            value: protocols.length,
            icon: Activity,
            color: 'text-primary'
          },
          {
            label: 'Completed',
            value: protocols.filter((p: any) => p.status === 'completed').length,
            icon: CheckCircle,
            color: 'text-success'
          },
          {
            label: 'Processing',
            value: protocols.filter((p: any) => p.status === 'processing' || p.status === 'pending').length,
            icon: Clock,
            color: 'text-warning'
          },
          {
            label: 'Failed',
            value: protocols.filter((p: any) => p.status === 'failed').length,
            icon: AlertCircle,
            color: 'text-destructive'
          },
        ].map((stat, index) => (
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

      {/* Protocols Table */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Processing Status</CardTitle>
          <CardDescription>
            View and manage protocol processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No protocols in processing pipeline</p>
            </div>
          ) : (
            <div className="space-y-4">
              {protocols.map((protocol: any, index: number) => (
                <motion.div
                  key={protocol.trial_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{protocol.trial_id}</p>
                      {getStatusBadge(protocol.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {protocol.upload_date && (
                        <p>Uploaded: {new Date(protocol.upload_date).toLocaleString()}</p>
                      )}
                      {protocol.last_updated && (
                        <p>Last Updated: {new Date(protocol.last_updated).toLocaleString()}</p>
                      )}
                      {protocol.criteria_count !== undefined && (
                        <p>Criteria: {protocol.criteria_count}</p>
                      )}
                      {protocol.error_message && (
                        <p className="text-destructive font-medium">
                          Error: {protocol.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {protocol.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReprocess(protocol.trial_id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(protocol.trial_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
