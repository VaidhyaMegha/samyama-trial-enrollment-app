import { useAuth } from '@/contexts/AuthContext';
import { CRCDashboard } from '@/components/dashboards/CRCDashboard';
import { StudyAdminDashboard } from '@/components/dashboards/StudyAdminDashboard';
import { PIDashboard } from '@/components/dashboards/PIDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'CRC':
      return <CRCDashboard />;
    case 'StudyAdmin':
      return <StudyAdminDashboard />;
    case 'PI':
      return <PIDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Invalid user role</p>
        </div>
      );
  }
}
