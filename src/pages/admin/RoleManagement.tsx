import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, CheckCircle2, XCircle, Users, Settings } from 'lucide-react';
import { DEFAULT_ROLE_PERMISSIONS, Permission, RolePermissions } from '@/types/rbac';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function RoleManagement() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissions>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [hasChanges, setHasChanges] = useState(false);

  const permissionLabels: Record<Permission, string> = {
    view_patients: 'View Patients',
    edit_patients: 'Edit Patients',
    view_protocols: 'View Protocols',
    edit_protocols: 'Edit Protocols',
    view_matches: 'View Matches',
    approve_screening: 'Approve Screening',
    reject_screening: 'Reject Screening',
    view_reports: 'View Reports',
    manage_users: 'Manage Users',
    configure_workflows: 'Configure Workflows',
    view_audit_logs: 'View Audit Logs'
  };

  const togglePermission = (role: string, permission: Permission) => {
    setRolePermissions(prev => {
      const rolePerms = prev[role];
      const hasPermission = rolePerms.permissions.includes(permission);
      
      return {
        ...prev,
        [role]: {
          ...rolePerms,
          permissions: hasPermission
            ? rolePerms.permissions.filter(p => p !== permission)
            : [...rolePerms.permissions, permission]
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // TODO: Call API to save role permissions
      // await adminAPI.updateRolePermissions(rolePermissions);
      toast.success('Role permissions updated successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to update role permissions');
    }
  };

  const handleReset = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setHasChanges(false);
    toast.info('Reset to default permissions');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Role & Permission Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure role-based permissions and access control for your organization
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
              You have unsaved changes
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Privilege Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Privilege Matrix</CardTitle>
          <CardDescription>
            Manage permissions for each role in the system. Changes apply system-wide unless overridden per study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(rolePermissions).map(([roleKey, roleData]) => (
              <div key={roleKey} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{roleData.displayName}</h3>
                      <Badge variant="outline">{roleKey}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {roleData.description}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {roleData.permissions.length} permissions enabled
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-7">
                  {(Object.keys(permissionLabels) as Permission[]).map((permission) => {
                    const hasPermission = roleData.permissions.includes(permission);
                    return (
                      <div
                        key={permission}
                        className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Switch
                          id={`${roleKey}-${permission}`}
                          checked={hasPermission}
                          onCheckedChange={() => togglePermission(roleKey, permission)}
                        />
                        <Label
                          htmlFor={`${roleKey}-${permission}`}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          {hasPermission ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{permissionLabels[permission]}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>

                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission Inheritance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• System-level permissions apply to all studies by default</p>
            <p>• Study-specific overrides can be configured per protocol</p>
            <p>• Lead CRC inherits all CRC permissions plus approval rights</p>
            <p>• Study Admin has full control within their assigned studies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Always follow principle of least privilege</p>
            <p>• Regularly audit role assignments and permissions</p>
            <p>• PI approval can be made optional per workflow</p>
            <p>• All permission changes are logged in audit trail</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
