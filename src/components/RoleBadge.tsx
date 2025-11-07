import { Badge } from '@/components/ui/badge';
import { Shield, User, UserCheck, Crown } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface RoleBadgeProps {
  role: UserRole | 'Lead_CRC';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RoleBadge({ role, size = 'md', showIcon = true }: RoleBadgeProps) {
  const roleConfig = {
    CRC: {
      label: 'CRC',
      icon: User,
      variant: 'secondary' as const,
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
    },
    Lead_CRC: {
      label: 'Lead CRC',
      icon: UserCheck,
      variant: 'secondary' as const,
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
    },
    StudyAdmin: {
      label: 'Study Admin',
      icon: Shield,
      variant: 'secondary' as const,
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
    },
    PI: {
      label: 'PI',
      icon: Crown,
      variant: 'secondary' as const,
      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
    }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs h-5',
    md: 'text-sm h-6',
    lg: 'text-base h-7'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} font-medium`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {config.label}
    </Badge>
  );
}
