import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import { FileSearch, RefreshCw, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuditTrail() {
  const [loading, setLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    resource_type: '',
    limit: 50
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await adminAPI.getAuditTrail(cleanFilters);
      setAuditEvents(response.data);
    } catch (error: any) {
      console.error('Error fetching audit trail:', error);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuditTrail();
  };

  const handleApplyFilters = () => {
    fetchAuditTrail();
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      view: 'outline',
      approve: 'default',
      reject: 'destructive',
    };
    return <Badge variant={variants[action] || 'outline'}>{action.toUpperCase()}</Badge>;
  };

  const getResourceBadge = (resourceType: string) => {
    return (
      <Badge variant="outline" className="bg-accent">
        {resourceType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <FileSearch className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground mt-2">
            Track all user actions and system events
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
            Filter audit events by user, action, or resource type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Input
                placeholder="Filter by user..."
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Type</label>
              <Select
                value={filters.resource_type || "all"}
                onValueChange={(value) => setFilters({ ...filters, resource_type: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  <SelectItem value="protocol">Protocol</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleApplyFilters} className="mt-4">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({auditEvents.length})</CardTitle>
          <CardDescription>
            Recent user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit events found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditEvents.map((event: any, index: number) => (
                <motion.div
                  key={event.event_id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(event.action)}
                        {getResourceBadge(event.resource_type)}
                        <span className="text-sm text-muted-foreground">
                          by <span className="font-medium">{event.user_id || event.user || 'System'}</span>
                        </span>
                      </div>
                      <p className="text-sm">
                        Resource: <span className="font-medium">{event.resource_id}</span>
                      </p>
                      {event.details && (
                        <p className="text-sm text-muted-foreground">
                          {typeof event.details === 'string'
                            ? event.details
                            : JSON.stringify(event.details, null, 2)}
                        </p>
                      )}
                      {event.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {event.ip_address}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {event.timestamp && (
                        <p>{new Date(event.timestamp).toLocaleString()}</p>
                      )}
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
