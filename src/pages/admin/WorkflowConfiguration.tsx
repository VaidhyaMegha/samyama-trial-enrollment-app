import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { GitBranch, AlertTriangle, CheckCircle, Settings, Info } from 'lucide-react';
import { WorkflowConfiguration, DEFAULT_WORKFLOW, WorkflowApprovalLevel } from '@/types/rbac';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function WorkflowConfigurationPage() {
  const [config, setConfig] = useState<Omit<WorkflowConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    ...DEFAULT_WORKFLOW,
    studyId: undefined,
    sponsorId: undefined
  });
  const [hasChanges, setHasChanges] = useState(false);

  const approvalLevelLabels: Record<WorkflowApprovalLevel, string> = {
    CRC: 'Clinical Research Coordinator',
    Lead_CRC: 'Lead CRC',
    StudyAdmin: 'Study Administrator',
    PI: 'Principal Investigator'
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleApprovalLevel = (level: WorkflowApprovalLevel) => {
    const newLevels = config.approvalLevels.includes(level)
      ? config.approvalLevels.filter(l => l !== level)
      : [...config.approvalLevels, level];
    
    updateConfig({ approvalLevels: newLevels });
  };

  const handleSave = async () => {
    try {
      // Validation
      if (config.approvalLevels.length === 0) {
        toast.error('At least one approval level must be selected');
        return;
      }
      
      if (config.minimumApprovers > config.approvalLevels.length) {
        toast.error('Minimum approvers cannot exceed available approval levels');
        return;
      }

      // TODO: Call API to save workflow configuration
      // await adminAPI.updateWorkflowConfiguration(config);
      toast.success('Workflow configuration saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save workflow configuration');
    }
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_WORKFLOW,
      studyId: undefined,
      sponsorId: undefined
    });
    setHasChanges(false);
    toast.info('Reset to default workflow');
  };

  const getWorkflowDescription = () => {
    if (!config.requirePIApproval && config.approvalLevels.includes('StudyAdmin')) {
      return 'Study Admin can approve screening independently without PI involvement';
    }
    if (!config.requirePIApproval && config.approvalLevels.includes('Lead_CRC')) {
      return 'Lead CRC can approve screening independently without PI involvement';
    }
    if (config.requirePIApproval) {
      return 'PI approval is mandatory for all screening approvals';
    }
    return 'Standard approval workflow with configured levels';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GitBranch className="h-8 w-8 text-primary" />
          Approval Workflow Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure flexible approval workflows aligned with your site operations
        </p>
      </div>

      {/* Action Bar */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-900 dark:text-orange-100">
              You have unsaved workflow changes
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button onClick={handleSave}>
              Save Workflow
            </Button>
          </div>
        </motion.div>
      )}

      {/* Workflow Overview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Workflow:</strong> {getWorkflowDescription()}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* PI Approval Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              PI Approval Requirement
              {!config.requirePIApproval ? (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Optional
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Mandatory
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Make PI approval optional to align with real-world site operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-pi">Require PI Approval</Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, screening can proceed without PI sign-off
                </p>
              </div>
              <Switch
                id="require-pi"
                checked={config.requirePIApproval}
                onCheckedChange={(checked) => {
                  updateConfig({ requirePIApproval: checked });
                  // If enabling PI approval, ensure PI is in approval levels
                  if (checked && !config.approvalLevels.includes('PI')) {
                    updateConfig({ 
                      requirePIApproval: checked,
                      approvalLevels: [...config.approvalLevels, 'PI']
                    });
                  }
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Benefits of Optional PI Approval:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reduces workflow bottlenecks</li>
                <li>• Empowers Study Admin and Lead CRC</li>
                <li>• Matches real-world site operations</li>
                <li>• PI can still review post-approval</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Approval Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Authority Levels</CardTitle>
            <CardDescription>
              Select which roles can approve patient screening
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(approvalLevelLabels) as WorkflowApprovalLevel[]).map((level) => {
              const isSelected = config.approvalLevels.includes(level);
              const isDisabled = config.requirePIApproval && level === 'PI';
              
              return (
                <div
                  key={level}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isSelected ? 'bg-primary/5 border-primary' : 'bg-card'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={`level-${level}`} className="font-medium">
                      {approvalLevelLabels[level]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {level === 'Lead_CRC' && 'Elevated CRC with approval authority'}
                      {level === 'StudyAdmin' && 'Full administrative control'}
                      {level === 'PI' && 'Clinical oversight and final authority'}
                      {level === 'CRC' && 'Standard coordinator (view only)'}
                    </p>
                  </div>
                  <Switch
                    id={`level-${level}`}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => toggleApprovalLevel(level)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure multi-level and parallel approval options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min-approvers">Minimum Required Approvers</Label>
              <Select
                value={config.minimumApprovers.toString()}
                onValueChange={(value) => updateConfig({ minimumApprovers: parseInt(value) })}
              >
                <SelectTrigger id="min-approvers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Approver</SelectItem>
                  <SelectItem value="2">2 Approvers</SelectItem>
                  <SelectItem value="3">3 Approvers</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Number of approvals required before screening proceeds
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="parallel">Allow Parallel Approvals</Label>
                <p className="text-sm text-muted-foreground">
                  Multiple roles can approve simultaneously
                </p>
              </div>
              <Switch
                id="parallel"
                checked={config.allowParallelApprovals}
                onCheckedChange={(checked) => updateConfig({ allowParallelApprovals: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Workflow Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Preview</CardTitle>
            <CardDescription>
              Visual representation of your approval chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.approvalLevels.length === 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No approval levels selected. Select at least one role.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Start</Badge>
                    <span className="text-muted-foreground">Patient Match Created</span>
                  </div>
                  
                  {config.approvalLevels.map((level, index) => (
                    <div key={level} className="flex items-center gap-2">
                      <div className="h-8 w-px bg-border ml-8" />
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className="bg-primary/10 text-primary border-primary">
                          {approvalLevelLabels[level]}
                        </Badge>
                        {config.requirePIApproval && level === 'PI' && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-px bg-border ml-8" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                    <span className="text-muted-foreground">
                      Proceed to Screening Visit
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
