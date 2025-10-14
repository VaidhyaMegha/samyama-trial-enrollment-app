import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { matchesAPI } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      // Load ALL matches (no filter) so we can show counts for each tab
      const response = await matchesAPI.getAll();

      // Transform match data to match frontend expectations
      const transformedMatches = (response.data || []).map((match: any) => ({
        id: match.match_id,
        patientId: match.patient_id,
        patientName: match.patient_name,
        protocolId: match.protocol_id,
        protocolName: match.protocol_name,
        matchScore: match.match_score,
        date: new Date(match.created_at).toLocaleDateString(),
        status: match.status,
        notes: match.notes,
        createdAt: match.created_at,
        updatedAt: match.updated_at
      }));

      setMatches(transformedMatches);

      if (transformedMatches.length > 0) {
        toast.success(`Loaded ${transformedMatches.length} matches`);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load matches from backend');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClick = (match: any, action: 'approve' | 'reject') => {
    setSelectedMatch(match);
    setReviewAction(action);
    setReviewNotes('');
  };

  const handleReviewConfirm = async () => {
    if (!selectedMatch || !reviewAction) return;

    setIsReviewing(true);
    try {
      await matchesAPI.review(selectedMatch.id, reviewAction, reviewNotes);
      toast.success(`Match ${reviewAction}d successfully`);

      // Reload matches to get fresh data from backend
      await loadMatches();

      // Close dialog
      setSelectedMatch(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (error: any) {
      console.error('Error reviewing match:', error);
      toast.error(error.response?.data?.message || 'Failed to review match');
    } finally {
      setIsReviewing(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'all') return true;
    return match.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Matches</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve patient-protocol matches
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({matches.filter(m => m.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({matches.filter(m => m.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({matches.filter(m => m.status === 'rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending'
                    ? 'No pending matches to review'
                    : `No ${activeTab} matches`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">
                              {match.patientId}
                            </CardTitle>
                            <Badge
                              variant={getStatusBadgeVariant(match.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(match.status)}
                              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                            </Badge>
                          </div>
                          <CardDescription>
                            Matched with: {match.protocolName}
                          </CardDescription>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg border-2 font-bold text-xl ${getMatchScoreColor(
                            match.matchScore
                          )}`}
                        >
                          {match.matchScore}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Protocol ID
                            </p>
                            <p className="text-sm font-semibold">
                              {match.protocolId}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Match Date
                            </p>
                            <p className="text-sm font-semibold">{match.date}</p>
                          </div>
                        </div>

                        {match.status === 'pending' && (
                          <div className="flex gap-3 pt-4">
                            <Button
                              variant="default"
                              className="flex-1"
                              onClick={() => handleReviewClick(match, 'approve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve Match
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleReviewClick(match, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Match
                            </Button>
                          </div>
                        )}

                        {match.status === 'approved' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                              ✓ This match has been approved and the patient can proceed with enrollment.
                            </p>
                          </div>
                        )}

                        {match.status === 'rejected' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                              ✗ This match has been rejected and will not proceed to enrollment.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <AlertDialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === 'approve' ? 'Approve Match' : 'Reject Match'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === 'approve'
                ? 'Are you sure you want to approve this patient-protocol match? The patient will be eligible to proceed with enrollment.'
                : 'Are you sure you want to reject this patient-protocol match? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments about this decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReviewing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReviewConfirm}
              disabled={isReviewing}
              className={reviewAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isReviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
