export interface Protocol {
  id: string;
  title: string;
  identifier: string;
  phase: string;
  status: 'active' | 'paused' | 'completed';
  uploadedAt: string;
  uploadedBy: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  criteriaCount: number;
  matchRate?: number;
}

export interface EligibilityCriteria {
  id: string;
  type: 'inclusion' | 'exclusion';
  category: string;
  text: string;
  matched: boolean;
  confidence: number;
}

export interface PatientMatch {
  id: string;
  protocolId: string;
  protocolTitle: string;
  patientId: string;
  overallConfidence: number;
  matchedCriteria: number;
  totalCriteria: number;
  criteria: EligibilityCriteria[];
  matchedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}
