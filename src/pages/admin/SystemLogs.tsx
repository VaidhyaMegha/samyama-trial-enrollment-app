import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import { Terminal, RefreshCw, Filter, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    log_group: '',
    filter_pattern: '',
    limit: 100
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await adminAPI.getLogs(cleanFilters);
      setLogs(response.data);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const getLogLevelIcon = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    } else if (lowerMessage.includes('warn')) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  const getLogLevelBadge = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return <Badge variant="destructive">ERROR</Badge>;
    } else if (lowerMessage.includes('warn')) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">WARN</Badge>;
    }
    return <Badge variant="outline">INFO</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Terminal className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading system logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            View CloudWatch logs for Lambda functions and system events
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter logs by log group, pattern, or time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Log Group</label>
              <Select
                value={filters.log_group || "all"}
                onValueChange={(value) => setFilters({ ...filters, log_group: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All log groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All log groups</SelectItem>
                  <SelectItem value="/aws/lambda/admin_manager">/aws/lambda/admin_manager</SelectItem>
                  <SelectItem value="/aws/lambda/protocol_orchestrator">/aws/lambda/protocol_orchestrator</SelectItem>
                  <SelectItem value="/aws/lambda/textract_processor">/aws/lambda/textract_processor</SelectItem>
                  <SelectItem value="/aws/lambda/section_classifier">/aws/lambda/section_classifier</SelectItem>
                  <SelectItem value="/aws/lambda/criteria_parser">/aws/lambda/criteria_parser</SelectItem>
                  <SelectItem value="/aws/lambda/fhir_search">/aws/lambda/fhir_search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Pattern</label>
              <Input
                placeholder="e.g., ERROR, failed, exception..."
                value={filters.filter_pattern}
                onChange={(e) => setFilters({ ...filters, filter_pattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleApplyFilters} className="mt-4">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries ({logs.length})</CardTitle>
          <CardDescription>
            Recent system logs and error messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any, index: number) => (
                <motion.div
                  key={log.timestamp || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors font-mono text-xs"
                >
                  <div className="flex items-start gap-3">
                    {getLogLevelIcon(log.message)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getLogLevelBadge(log.message)}
                        {log.log_stream && (
                          <Badge variant="outline" className="text-xs">
                            {log.log_stream}
                          </Badge>
                        )}
                        {log.timestamp && (
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-xs">
                        {log.message}
                      </pre>
                    </div>
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
