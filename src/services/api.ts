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

// Mock API methods
export const protocolsAPI = {
  getAll: async () => {
    // Mock data for now
    return {
      data: [
        {
          id: '1',
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
          id: '2',
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
          id: '3',
          nctId: 'NEURO-2024-008',
          title: 'Neurology Research Protocol for Alzheimer\'s',
          disease: 'Alzheimer\'s',
          phase: 'Phase I',
          status: 'Processing',
          uploadDate: '2024-01-20',
          enrollmentTarget: 50,
          enrollmentCurrent: 0,
        },
      ],
    };
  },
  
  upload: async (file: File) => {
    // Mock upload
    const formData = new FormData();
    formData.append('file', file);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: Math.random().toString(36).substr(2, 9),
            status: 'processing',
            message: 'Protocol uploaded successfully',
          },
        });
      }, 2000);
    });
  },
  
  search: async (query: string) => {
    const allProtocols = await protocolsAPI.getAll();
    return {
      data: allProtocols.data.filter((p: any) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.nctId.toLowerCase().includes(query.toLowerCase()) ||
        p.disease.toLowerCase().includes(query.toLowerCase())
      ),
    };
  },
};

export const eligibilityAPI = {
  check: async (protocolId: string, patientData: any) => {
    // Mock eligibility check
    return new Promise((resolve) => {
      setTimeout(() => {
        const overallScore = Math.floor(Math.random() * 40) + 60; // 60-100
        resolve({
          data: {
            overallConfidence: overallScore,
            criteria: [
              {
                id: '1',
                text: 'Age between 18-75 years',
                met: true,
                confidence: 95,
                patientValue: `${patientData.age} years`,
              },
              {
                id: '2',
                text: 'ECOG Performance Status 0-2',
                met: true,
                confidence: 90,
                patientValue: `ECOG ${patientData.ecogStatus}`,
              },
              {
                id: '3',
                text: 'Confirmed diagnosis of advanced melanoma',
                met: true,
                confidence: overallScore,
                patientValue: patientData.cancerType,
              },
              {
                id: '4',
                text: 'Adequate bone marrow function',
                met: patientData.labValues?.hemoglobin >= 9,
                confidence: 85,
                patientValue: `Hemoglobin: ${patientData.labValues?.hemoglobin || 'N/A'} g/dL`,
              },
              {
                id: '5',
                text: 'No prior immunotherapy',
                met: !patientData.priorTreatments?.includes('Immunotherapy'),
                confidence: 80,
                patientValue: patientData.priorTreatments?.join(', ') || 'None',
              },
            ],
          },
        });
      }, 3000);
    });
  },
};

export const matchesAPI = {
  getPending: async () => {
    // Mock pending matches
    return {
      data: [
        {
          id: '1',
          patientId: 'PT-1234',
          protocolId: 'ONCOLOGY-2024-001',
          protocolName: 'Phase III Oncology Trial',
          matchScore: 92,
          date: '2024-01-20',
          status: 'pending',
        },
        {
          id: '2',
          patientId: 'PT-5678',
          protocolId: 'CARDIO-2024-015',
          protocolName: 'Cardiovascular Study',
          matchScore: 85,
          date: '2024-01-19',
          status: 'pending',
        },
        {
          id: '3',
          patientId: 'PT-9012',
          protocolId: 'NEURO-2024-008',
          protocolName: 'Neurology Research',
          matchScore: 67,
          date: '2024-01-18',
          status: 'pending',
        },
      ],
    };
  },
  
  review: async (matchId: string, action: 'approve' | 'reject', notes?: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            message: `Match ${action}d successfully`,
          },
        });
      }, 1000);
    });
  },
};

export default api;
