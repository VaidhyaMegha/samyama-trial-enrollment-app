import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Users, 
  Settings,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink, useLocation } from 'react-router-dom';

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const getMenuItems = () => {
    const common = [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Settings', url: '/settings', icon: Settings },
    ];

    const roleSpecific = {
      CRC: [
        { title: 'Eligibility Check', url: '/eligibility-check', icon: ClipboardCheck },
        { title: 'Patient Matches', url: '/matches', icon: Activity },
      ],
      StudyAdmin: [
        { title: 'Protocols', url: '/protocols', icon: FileText },
        { title: 'Analytics', url: '/analytics', icon: Activity },
      ],
      PI: [
        { title: 'Enrollment', url: '/enrollment', icon: Users },
        { title: 'Match Review', url: '/review', icon: ClipboardCheck },
      ],
    };

    return [...common.slice(0, 1), ...(roleSpecific[user?.role as keyof typeof roleSpecific] || []), ...common.slice(1)];
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <div className="flex h-16 items-center px-6 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">TrialMatch</span>
            </div>
          )}
          {collapsed && <Activity className="h-6 w-6 text-primary mx-auto" />}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
