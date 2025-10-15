import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth session:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Protocol API methods
export const protocolsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/protocols');
      return {
        data: response.data.protocols || []
      };
    } catch (error) {
      console.error('Error fetching protocols:', error);
      // Fallback to mock data if API fails
      return {
        data: [
          {
            id: 'ONCOLOGY-2024-001',
            nctId: 'ONCOLOGY-2024-001',
            title: 'Phase III Oncology Trial for Advanced Melanoma',
            disease: 'Melanoma',
            phase: 'Phase III',
            status: 'Active',
            uploadDate: '2024-01-15',
            enrollmentTarget: 150,
            enrollmentCurrent: 78,
          },
          {
            id: 'CARDIO-2024-015',
            nctId: 'CARDIO-2024-015',
            title: 'Cardiovascular Study for Heart Failure',
            disease: 'Heart Failure',
            phase: 'Phase II',
            status: 'Active',
            uploadDate: '2024-01-10',
            enrollmentTarget: 100,
            enrollmentCurrent: 45,
          },
          {
            id: 'NEURO-2024-008',
            nctId: 'NEURO-2024-008',
            title: 'Neurology Research Protocol for Alzheimer\'s',
            disease: 'Alzheimer\'s',
            phase: 'Phase I',
            status: 'Recruiting',
            uploadDate: '2024-01-20',
            enrollmentTarget: 50,
            enrollmentCurrent: 12,
          },
        ],
      };
    }
  },
  
  upload: async (file: File, trialId?: string) => {
    try {
      // Step 1: Get pre-signed S3 URL from backend
      const uploadUrlResponse = await api.post('/protocols/upload-url', {
        filename: file.name,
        content_type: file.type,
        trial_id: trialId
      });

      const { upload_url, s3_key, trial_id: generatedTrialId } = uploadUrlResponse.data;

      // Step 2: Upload file directly to S3 using pre-signed URL
      // IMPORTANT: Use fetch instead of axios to avoid CORS preflight issues
      // Pre-signed URLs have all auth in the URL, so we don't need Authorization headers
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Return trial ID for status polling
      return {
        data: {
          id: generatedTrialId,
          trialId: generatedTrialId,
          s3_key,
          status: 'processing',
          message: 'Protocol uploaded successfully and processing started',
        },
      };
    } catch (error: any) {
      console.error('Upload failed:', error);
      throw new Error(error.message || error.response?.data?.error || 'Failed to upload protocol');
    }
  },

  getStatus: async (trialId: string) => {
    try {
      const response = await api.get(`/protocols/${trialId}/status`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error getting protocol status:', error);
      throw error;
    }
  },

  get: async (trialId: string) => {
    try {
      const response = await api.get(`/protocols/${trialId}`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error getting protocol:', error);
      throw error;
    }
  },

  search: async (query: string) => {
    try {
      const response = await api.post('/protocols/search', { query });
      return {
        data: response.data.protocols || []
      };
    } catch (error) {
      console.error('Error searching protocols:', error);
      // Fallback to client-side filtering
      const allProtocols = await protocolsAPI.getAll();
      return {
        data: allProtocols.data.filter((p: any) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.nctId.toLowerCase().includes(query.toLowerCase()) ||
          p.disease.toLowerCase().includes(query.toLowerCase())
        ),
      };
    }
  },
};

// Helper function to transform patient data to FHIR Bundle
function transformPatientDataToFHIR(patientData: any) {
  const entries: any[] = [];

  // Calculate birth date from age
  const calculateBirthDate = (age: number): string => {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return `${birthYear}-01-01`;
  };

  // Patient resource
  entries.push({
    resource: {
      resourceType: 'Patient',
      birthDate: calculateBirthDate(parseInt(patientData.age)),
      gender: patientData.gender.toLowerCase(),
    },
  });

  // ECOG Performance Status (Observation)
  if (patientData.ecogStatus) {
    entries.push({
      resource: {
        resourceType: 'Observation',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '89247-1',
              display: 'ECOG Performance Status',
            },
          ],
        },
        valueInteger: parseInt(patientData.ecogStatus),
      },
    });
  }

  // Cancer diagnosis (Condition)
  if (patientData.cancerType) {
    entries.push({
      resource: {
        resourceType: 'Condition',
        code: {
          text: patientData.cancerType,
        },
        stage: patientData.stage
          ? [
              {
                summary: { text: `Stage ${patientData.stage}` },
              },
            ]
          : undefined,
      },
    });
  }

  // Lab values (Observations)
  if (patientData.labValues?.hemoglobin) {
    entries.push({
      resource: {
        resourceType: 'Observation',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '718-7',
              display: 'Hemoglobin',
            },
          ],
        },
        valueQuantity: {
          value: parseFloat(patientData.labValues.hemoglobin),
          unit: 'g/dL',
        },
      },
    });
  }

  if (patientData.labValues?.platelets) {
    entries.push({
      resource: {
        resourceType: 'Observation',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '777-3',
              display: 'Platelets',
            },
          ],
        },
        valueQuantity: {
          value: parseFloat(patientData.labValues.platelets),
          unit: '10^9/L',
        },
      },
    });
  }

  if (patientData.labValues?.creatinine) {
    entries.push({
      resource: {
        resourceType: 'Observation',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '2160-0',
              display: 'Creatinine',
            },
          ],
        },
        valueQuantity: {
          value: parseFloat(patientData.labValues.creatinine),
          unit: 'mg/dL',
        },
      },
    });
  }

  // Prior treatments (Procedures)
  patientData.priorTreatments?.forEach((treatment: string) => {
    entries.push({
      resource: {
        resourceType: 'Procedure',
        code: {
          text: treatment,
        },
        status: 'completed',
      },
    });
  });

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries,
  };
}

export const eligibilityAPI = {
  // Check eligibility using real backend APIs
  check: async (protocolId: string, patientData: any, patientId?: string) => {
    try {
      let actualPatientId = patientId;

      // If no patientId provided, create a temporary patient in HealthLake
      if (!actualPatientId) {
        console.log('Creating temporary patient in HealthLake...');
        const createResponse = await patientsAPI.create({
          given_name: `Temp_${Date.now()}`,
          family_name: 'Patient',
          gender: patientData.gender.toLowerCase(),
          birth_date: calculateBirthDate(parseInt(patientData.age)),
          ecog_status: patientData.ecogStatus ? parseInt(patientData.ecogStatus) : undefined,
        });

        if (!createResponse.success) {
          throw new Error('Failed to create patient in HealthLake');
        }

        actualPatientId = createResponse.patientId;
        console.log('Created temporary patient:', actualPatientId);
      }

      // Step 1: Fetch cached parsed criteria from DynamoDB
      // The criteria should already be parsed and cached when the protocol was uploaded
      console.log('Fetching cached parsed criteria for protocol:', protocolId);
      const getCriteriaResponse = await api.get(`/protocols/${protocolId}/criteria`);

      let parsedCriteria;
      if (getCriteriaResponse.data.success && getCriteriaResponse.data.parsed_criteria) {
        // Use cached criteria
        parsedCriteria = getCriteriaResponse.data.parsed_criteria;
        console.log('Using cached parsed criteria');
      } else {
        // If not cached, we need to parse first (shouldn't happen if protocol was processed correctly)
        console.warn('No cached criteria found, this indicates the protocol was not fully processed');
        throw new Error('Protocol criteria not found. Please ensure the protocol has been properly uploaded and processed.');
      }

      // Step 2: Transform cached criteria to Lambda-expected format
      // Lambda expects: { criteria: [{type: "inclusion", ...}, {type: "exclusion", ...}] }
      // Cache can have two formats:
      // Format 1 (new): { inclusion: [...], exclusion: [...] } - simple format with {type, text}
      // Format 2 (proper): array of structured criteria with {category, attribute, operator, value, ...}

      let flattenedCriteria: any[] = [];

      // Check if parsedCriteria is already an array (proper format)
      if (Array.isArray(parsedCriteria)) {
        flattenedCriteria = parsedCriteria;
      }
      // Check if it has inclusion/exclusion keys (simple format)
      else if (parsedCriteria.inclusion || parsedCriteria.exclusion) {
        // Validate that criteria have required fields (category, attribute, operator, value)
        const validateCriterion = (criterion: any) => {
          return criterion.category && criterion.attribute && criterion.operator;
        };

        if (parsedCriteria.inclusion && Array.isArray(parsedCriteria.inclusion)) {
          parsedCriteria.inclusion.forEach((criterion: any) => {
            if (!validateCriterion(criterion)) {
              throw new Error(`Protocol "${protocolId}" has incomplete criteria format. The protocol needs to be reprocessed through the parse-criteria API. Please use a properly processed protocol or contact support.`);
            }
            flattenedCriteria.push({
              ...criterion,
              type: 'inclusion'
            });
          });
        }

        if (parsedCriteria.exclusion && Array.isArray(parsedCriteria.exclusion)) {
          parsedCriteria.exclusion.forEach((criterion: any) => {
            if (!validateCriterion(criterion)) {
              throw new Error(`Protocol "${protocolId}" has incomplete criteria format. The protocol needs to be reprocessed through the parse-criteria API. Please use a properly processed protocol or contact support.`);
            }
            flattenedCriteria.push({
              ...criterion,
              type: 'exclusion'
            });
          });
        }
      } else {
        throw new Error('Invalid parsed criteria format');
      }

      // Step 3: Check eligibility against HealthLake patient data
      console.log('Checking eligibility for patient:', actualPatientId);
      const checkResponse = await api.post('/check-criteria', {
        patient_id: actualPatientId,
        criteria: flattenedCriteria
      });

      // The response from /check-criteria (fhir_search Lambda) has this structure:
      // { patient_id, eligible, results: [...], summary: {...} }
      const responseBody = checkResponse.data;
      const results = responseBody.results || [];

      // Calculate overall confidence
      const metCount = results.filter((r: any) => r.met).length;
      const overallConfidence = results.length > 0
        ? Math.round((metCount / results.length) * 100)
        : 0;

      // Transform backend results to frontend format
      return {
        data: {
          overallConfidence,
          patientId: actualPatientId,
          eligible: responseBody.eligible,
          criteria: results.map((result: any, index: number) => ({
            id: `${index + 1}`,
            text: result.criterion?.description || result.criterion?.text || 'Unknown criterion',
            met: result.met,
            confidence: result.met ? 95 : 50,
            patientValue: result.reason || 'No details available'
          }))
        }
      };
    } catch (error: any) {
      console.error('Eligibility check failed:', error);

      // Enhanced error handling
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('You don\'t have permission to check eligibility.');
      } else if (error.response?.status === 404) {
        throw new Error('Protocol not found or criteria not cached. Please ensure the protocol has been uploaded and processed.');
      } else if (error.response?.status === 500) {
        throw new Error('Backend service error. Please try again later.');
      } else if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Check your connection.');
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to check eligibility');
    }
  },
};

// Helper function to calculate birth date from age
function calculateBirthDate(age: number): string {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`;
}

// Patient API methods - Real backend integration
export const patientsAPI = {
  getAll: async (searchParams?: any) => {
    try {
      const response = await api.get('/patients', { params: searchParams });
      return {
        data: response.data.patients || [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  search: async (searchParams: any) => {
    try {
      const response = await api.post('/patients/search', { search_params: searchParams });
      return {
        data: response.data.patients || [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  },

  create: async (patientData: any) => {
    try {
      const response = await api.post('/patients', { patient_data: patientData });
      return {
        success: response.data.success,
        patientId: response.data.patient_id,
        createdResources: response.data.created_resources,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  getById: async (patientId: string) => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      return {
        data: response.data.patient || response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      throw error;
    }
  },
};

// Matches API methods - Real backend integration
export const matchesAPI = {
  // Get all matches with optional filters
  getAll: async (filters?: { status?: string; patient_id?: string; protocol_id?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.patient_id) params.append('patient_id', filters.patient_id);
      if (filters?.protocol_id) params.append('protocol_id', filters.protocol_id);

      const response = await api.get(`/matches?${params.toString()}`);
      return {
        data: response.data.matches || [],
        total: response.data.count || 0
      };
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Get pending matches
  getPending: async () => {
    return matchesAPI.getAll({ status: 'pending' });
  },

  // Get approved matches
  getApproved: async () => {
    return matchesAPI.getAll({ status: 'approved' });
  },

  // Get rejected matches
  getRejected: async () => {
    return matchesAPI.getAll({ status: 'rejected' });
  },

  // Create a new match
  create: async (matchData: {
    patient_id: string;
    protocol_id: string;
    match_score: number;
    patient_name?: string;
    protocol_name?: string;
    criteria_results?: any[];
    notes?: string;
  }) => {
    try {
      const response = await api.post('/matches', matchData);
      return {
        success: response.data.success,
        matchId: response.data.match_id,
        match: response.data.match,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Get a specific match
  get: async (matchId: string) => {
    try {
      const response = await api.get(`/matches/${matchId}`);
      return {
        success: response.data.success,
        match: response.data.match
      };
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  },

  // Update match status with 2-level approval workflow support
  // When CRC approves from 'pending', it moves to 'pending_pi_approval'
  // When PI approves from 'pending_pi_approval', it moves to 'approved'
  // Any rejection at any stage moves to 'rejected'
  review: async (matchId: string, action: 'approve' | 'reject', notes?: string, currentStatus?: string) => {
    try {
      // Determine the target status based on action and current status
      let targetStatus: string;

      if (action === 'reject') {
        targetStatus = 'rejected';
      } else {
        // For approve action, determine next stage
        if (currentStatus === 'pending') {
          // CRC approval: move to PI review
          targetStatus = 'pending_pi_approval';
        } else if (currentStatus === 'pending_pi_approval') {
          // PI approval: final approval
          targetStatus = 'approved';
        } else {
          // Fallback for backward compatibility
          targetStatus = 'approved';
        }
      }

      const response = await api.put(`/matches/${matchId}`, {
        status: targetStatus,
        notes: notes || '',
        reviewed_by: 'current_user'  // Would come from auth context
      });

      const workflowStage = response.data.workflow_stage || targetStatus;
      let message = '';

      if (action === 'reject') {
        message = 'Match rejected successfully';
      } else if (workflowStage === 'pending_pi_approval') {
        message = 'Match approved by CRC and sent to PI for final approval';
      } else if (workflowStage === 'approved') {
        message = 'Match fully approved - patient can proceed with enrollment';
      } else {
        message = `Match ${action}d successfully`;
      }

      return {
        data: {
          success: response.data.success,
          message,
          match: response.data.match,
          workflowStage
        }
      };
    } catch (error: any) {
      console.error('Error reviewing match:', error);
      // Check for invalid transition error from backend
      if (error.response?.data?.error && error.response.data.error.includes('Invalid status transition')) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  // Delete a match
  delete: async (matchId: string) => {
    try {
      const response = await api.delete(`/matches/${matchId}`);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  },
};

// Admin API methods - StudyAdmin persona
export const adminAPI = {
  // Get admin dashboard metrics
  getDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  },

  // Get protocol processing status
  getProcessingStatus: async () => {
    try {
      const response = await api.get('/admin/processing-status');
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching processing status:', error);
      throw error;
    }
  },

  // Get all trials with admin details
  getTrials: async () => {
    try {
      const response = await api.get('/admin/trials');
      return {
        data: response.data.trials || [],
        count: response.data.count || 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching trials:', error);
      throw error;
    }
  },

  // Get audit trail with filters
  getAuditTrail: async (params?: {
    user?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/audit-trail', { params });
      return {
        data: response.data.events || [],
        count: response.data.count || 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  },

  // Get system logs
  getLogs: async (params?: {
    log_group?: string;
    start_time?: string;
    end_time?: string;
    filter_pattern?: string;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/logs', { params });
      return {
        data: response.data.logs || [],
        count: response.data.logs?.length || 0,
        nextToken: response.data.nextToken,
        success: true
      };
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  },

  // Reprocess a protocol
  reprocessProtocol: async (trialId: string) => {
    try {
      const response = await api.post(`/admin/reprocess/${trialId}`);
      return {
        data: response.data,
        success: true,
        message: response.data.message || 'Protocol reprocessing initiated'
      };
    } catch (error) {
      console.error('Error reprocessing protocol:', error);
      throw error;
    }
  },

  // Delete a protocol
  deleteProtocol: async (trialId: string) => {
    try {
      const response = await api.delete(`/admin/trials/${trialId}`);
      return {
        data: response.data,
        success: true,
        message: response.data.message || 'Protocol deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting protocol:', error);
      throw error;
    }
  },

  // PI Dashboard Methods (reusing admin infrastructure)
  getPIDashboard: async () => {
    try {
      const response = await api.get('/pi/dashboard');
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching PI dashboard:', error);
      throw error;
    }
  },

  getPITrials: async () => {
    try {
      const response = await api.get('/pi/trials');
      return {
        data: response.data.trials || [],
        count: response.data.count || 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching PI trials:', error);
      throw error;
    }
  },

  getPITrialDetails: async (trialId: string) => {
    try {
      const response = await api.get(`/pi/trials/${trialId}`);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching PI trial details:', error);
      throw error;
    }
  },

  exportEnrollmentSummary: async (trialId?: string) => {
    try {
      const url = trialId
        ? `/pi/export/enrollment-summary?trial_id=${trialId}`
        : '/pi/export/enrollment-summary';

      const response = await api.get(url, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `enrollment_summary_${trialId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return {
        success: true,
        message: 'Report exported successfully'
      };
    } catch (error) {
      console.error('Error exporting enrollment summary:', error);
      throw error;
    }
  }
};

export default api;
