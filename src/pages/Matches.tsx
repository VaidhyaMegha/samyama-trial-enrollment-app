import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, Loader2, UserCheck, Shield, AlertCircle, Info } from 'lucide-react';
import { matchesAPI } from '@/services/api';
import { RoleBadge } from '@/components/RoleBadge';
import { DEFAULT_WORKFLOW } from '@/types/rbac';
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
import { useAuth } from '@/contexts/AuthContext';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  
  // TODO: Load from API - for now using default workflow
  const workflowConfig = DEFAULT_WORKFLOW;

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

  // Check if current user can approve based on their role and workflow config
  const canApprove = (matchStatus: string): boolean => {
    if (!user) return false;

    // StudyAdmin can always approve at any stage
    if (user.role === 'StudyAdmin') return true;

    // Check workflow configuration for other roles
    const userWorkflowRole = user.isLeadCRC ? 'Lead_CRC' : user.role;
    
    if (matchStatus === 'pending') {
      // At pending stage, check if user role is in approval levels
      return workflowConfig.approvalLevels.includes(userWorkflowRole as any);
    }

    if (matchStatus === 'pending_pi_approval') {
      // At PI stage, only PI can approve (unless PI approval is not required)
      if (!workflowConfig.requirePIApproval) {
        // If PI approval not required, Lead_CRC and StudyAdmin can skip this stage
        return ['Lead_CRC', 'StudyAdmin'].includes(userWorkflowRole);
      }
      return user.role === 'PI';
    }

    return false;
  };

  const handleReviewConfirm = async () => {
    if (!selectedMatch || !reviewAction) return;

    setIsReviewing(true);
    try {
      const result = await matchesAPI.review(
        selectedMatch.id,
        reviewAction,
        reviewNotes,
        selectedMatch.status  // Pass current status for 2-level workflow
      );

      // Show workflow-aware success message
      toast.success(result.data.message || `Match ${reviewAction}d successfully`);

      // Reload matches to get fresh data from backend
      await loadMatches();

      // Close dialog
      setSelectedMatch(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (error: any) {
      console.error('Error reviewing match:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to review match');
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
      case 'pending_pi_approval':
        return 'secondary';
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
      case 'pending_pi_approval':
        return <UserCheck className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending CRC Review';
      case 'pending_pi_approval':
        return 'Pending PI Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            CRC Review ({matches.filter(m => m.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="pending_pi_approval" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            PI Approval ({matches.filter(m => m.status === 'pending_pi_approval').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({matches.filter(m => m.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-xl">
                              {match.patientId}
                            </CardTitle>
                            <Badge
                              variant={getStatusBadgeVariant(match.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(match.status)}
                              {getStatusLabel(match.status)}
                            </Badge>
                            {user && <RoleBadge role={user.isLeadCRC ? 'Lead_CRC' : user.role} size="sm" />}
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

                        {/* Initial Review Stage */}
                        {match.status === 'pending' && (
                          <div className="space-y-3 pt-4">
                            {!workflowConfig.requirePIApproval ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <strong>Streamlined Approval:</strong> PI approval is optional. Authorized roles can approve screening directly.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <strong>Review Required:</strong> Review this match to proceed with approval workflow.
                                </p>
                              </div>
                            )}
                            {canApprove(match.status) ? (
                              <div className="flex gap-3">
                                <Button
                                  variant="default"
                                  className="flex-1"
                                  onClick={() => handleReviewClick(match, 'approve')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {workflowConfig.requirePIApproval ? 'Approve & Send to PI' : 'Approve for Screening'}
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
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  You don't have permission to review matches at this stage.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PI Approval Stage (shown only if PI approval is required) */}
                        {match.status === 'pending_pi_approval' && (
                          <div className="space-y-3 pt-4">
                            <div className="space-y-2">
                              {workflowConfig.requirePIApproval ? (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                  <p className="text-sm text-purple-800 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    <strong>PI Approval Required:</strong> Initial review complete. Final PI approval needed to proceed with screening.
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-blue-800 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    <strong>Optional Review Stage:</strong> PI approval is optional for this workflow.
                                  </p>
                                </div>
                              )}
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs text-amber-800">
                                  ⚠️ <strong>Regulatory Reminder:</strong> Approval is based on preliminary AI match. Eligibility must be confirmed at the screening visit. Please recheck all inclusion/exclusion criteria during screening.
                                </p>
                              </div>
                            </div>
                            {canApprove(match.status) ? (
                              <div className="flex gap-3">
                                <Button
                                  variant="default"
                                  className="flex-1"
                                  onClick={() => handleReviewClick(match, 'approve')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {user?.role === 'PI' ? 'Final Approval (PI)' : 'Approve for Screening'}
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
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  {workflowConfig.requirePIApproval 
                                    ? 'Only Principal Investigator (PI) can provide final approval.'
                                    : 'You don\'t have permission to approve at this stage.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Approved State */}
                        {match.status === 'approved' && (
                          <div className="space-y-2">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-sm text-green-800 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <strong>Approved for Screening:</strong> This match has completed the approval workflow and patient can proceed with screening visit.
                              </p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-xs text-amber-800">
                                ⚠️ <strong>Important:</strong> Approval is based on preliminary AI match. Final eligibility must be confirmed during the screening visit per protocol requirements.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Rejected State */}
                        {match.status === 'rejected' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800 flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              <strong>Rejected:</strong> This match has been rejected and will not proceed to screening.
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
            <AlertDialogDescription className="space-y-3">
              <p>
                {reviewAction === 'approve'
                  ? 'Are you sure you want to approve this patient-protocol match? The patient will be eligible to proceed with screening.'
                  : 'Are you sure you want to reject this patient-protocol match? This action cannot be undone.'}
              </p>
              {reviewAction === 'approve' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>Regulatory Notice:</strong> This approval is based on preliminary AI analysis. Final eligibility confirmation is required at the screening visit per ICH-GCP guidelines.
                  </p>
                </div>
              )}
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
