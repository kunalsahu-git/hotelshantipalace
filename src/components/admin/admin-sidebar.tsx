'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  LayoutDashboard,
  Calendar,
  BedDouble,
  Users,
  Wrench,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ConciergeBell,
  ArrowRight,
} from 'lucide-react';
import { useAdmin } from './admin-provider';
import { useAuth } from '@/firebase';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { LifeBuoy } from 'lucide-react';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: ['admin', 'frontdesk'] },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar, role: ['admin', 'frontdesk'] },
  { href: '/admin/checkin', label: 'Check-in/Out', icon: ConciergeBell, role: ['admin', 'frontdesk'] },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble, role: ['admin', 'frontdesk', 'housekeeping'] },
  { href: '/admin/guests', label: 'Guests', icon: Users, role: ['admin', 'frontdesk'] },
  { href: '/admin/housekeeping', label: 'Housekeeping', icon: LifeBuoy, role: ['admin', 'housekeeping'] },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench, role: ['admin', 'frontdesk', 'housekeeping'] },
  { href: '/admin/bills', label: 'Bills', icon: FileText, role: ['admin', 'frontdesk'] },
  { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare, role: ['admin', 'frontdesk'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, role: ['admin'] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, role } = useAdmin();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  if (!user || !role) {
    return null; // Don't render sidebar on login page or if user/role is not available
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
        <Logo />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          if (!link.role.includes(role)) return null;

          const isActive = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/10'
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="p-3 rounded-md bg-sidebar-accent/5">
              <p className="text-sm font-semibold">{user.name}</p>
              <Badge variant="secondary" className="capitalize mt-1">{user.role}</Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-left mt-3 p-0 h-auto hover:bg-transparent">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
          </div>
      </div>
    </aside>
  );
}
