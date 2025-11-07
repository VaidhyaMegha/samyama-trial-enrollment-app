export type UserRole = 'CRC' | 'StudyAdmin' | 'PI' | 'Lead_CRC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  // Extended role properties
  isLeadCRC?: boolean; // Flag to identify Lead CRC role
  permissions?: string[]; // User-specific permission overrides
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
