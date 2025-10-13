import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { signIn, signOut, fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface CognitoIdToken {
  'cognito:groups'?: string[];
  email?: string;
  name?: string;
  sub: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.idToken) {
        const idToken = session.tokens.idToken.toString();
        const decodedToken = jwtDecode<CognitoIdToken>(idToken);
        
        const currentUserInfo = await getCurrentUser();
        
        // Extract role from Cognito groups
        const groups = decodedToken['cognito:groups'] || [];
        let role: UserRole = 'CRC';
        if (groups.includes('StudyAdmin')) role = 'StudyAdmin';
        else if (groups.includes('PI')) role = 'PI';
        else if (groups.includes('CRC')) role = 'CRC';
        
        const userData: User = {
          id: decodedToken.sub,
          email: decodedToken.email || currentUserInfo.username,
          name: decodedToken.name || currentUserInfo.username,
          role,
        };
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await signIn({ username, password });
      
      // Get session and decode token
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }
      
      const decodedToken = jwtDecode<CognitoIdToken>(idToken);
      const currentUserInfo = await getCurrentUser();
      
      // Extract role from Cognito groups
      const groups = decodedToken['cognito:groups'] || [];
      let role: UserRole = 'CRC';
      if (groups.includes('StudyAdmin')) role = 'StudyAdmin';
      else if (groups.includes('PI')) role = 'PI';
      else if (groups.includes('CRC')) role = 'CRC';
      
      const userData: User = {
        id: decodedToken.sub,
        email: decodedToken.email || currentUserInfo.username,
        name: decodedToken.name || currentUserInfo.username,
        role,
      };
      
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid username or password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('clinical_trial_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
