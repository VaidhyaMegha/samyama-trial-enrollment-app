export type Permission = 
  | 'view_patients'
  | 'edit_patients'
  | 'view_protocols'
  | 'edit_protocols'
  | 'view_matches'
  | 'approve_screening'
  | 'reject_screening'
  | 'view_reports'
  | 'manage_users'
  | 'configure_workflows'
  | 'view_audit_logs';

export type WorkflowApprovalLevel = 'CRC' | 'Lead_CRC' | 'StudyAdmin' | 'PI';

export interface RolePermissions {
  role: 'CRC' | 'Lead_CRC' | 'StudyAdmin' | 'PI';
  permissions: Permission[];
  displayName: string;
  description: string;
}

export interface WorkflowConfiguration {
  id: string;
  studyId?: string; // If null, applies to all studies
  sponsorId?: string; // If null, applies to all sponsors
  requirePIApproval: boolean;
  approvalLevels: WorkflowApprovalLevel[];
  minimumApprovers: number;
  allowParallelApprovals: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ApprovalRecord {
  id: string;
  matchId: string;
  patientId: string;
  protocolId: string;
  approverUserId: string;
  approverRole: WorkflowApprovalLevel;
  action: 'approved' | 'rejected';
  notes?: string;
  timestamp: string;
  workflowConfigId: string;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  CRC: {
    role: 'CRC',
    displayName: 'Clinical Research Coordinator',
    description: 'Standard CRC with basic patient screening capabilities',
    permissions: [
      'view_patients',
      'edit_patients',
      'view_protocols',
      'view_matches',
      'view_reports'
    ]
  },
  Lead_CRC: {
    role: 'Lead_CRC',
    displayName: 'Lead CRC',
    description: 'Senior CRC with screening approval authority',
    permissions: [
      'view_patients',
      'edit_patients',
      'view_protocols',
      'view_matches',
      'approve_screening',
      'reject_screening',
      'view_reports'
    ]
  },
  StudyAdmin: {
    role: 'StudyAdmin',
    displayName: 'Study Administrator',
    description: 'Full administrative control over studies and workflows',
    permissions: [
      'view_patients',
      'edit_patients',
      'view_protocols',
      'edit_protocols',
      'view_matches',
      'approve_screening',
      'reject_screening',
      'view_reports',
      'manage_users',
      'configure_workflows',
      'view_audit_logs'
    ]
  },
  PI: {
    role: 'PI',
    displayName: 'Principal Investigator',
    description: 'Clinical oversight and final approval authority (optional)',
    permissions: [
      'view_patients',
      'view_protocols',
      'view_matches',
      'approve_screening',
      'reject_screening',
      'view_reports',
      'view_audit_logs'
    ]
  }
};

export const DEFAULT_WORKFLOW: Omit<WorkflowConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  requirePIApproval: false,
  approvalLevels: ['Lead_CRC', 'StudyAdmin'],
  minimumApprovers: 1,
  allowParallelApprovals: true
};
