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
  Sparkles,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';
import { useAdmin } from './admin-provider';
import { useAuth } from '@/firebase';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/checkin', label: 'Check-in/Out', icon: ConciergeBell },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/admin/categories', label: 'Room Categories', icon: LayoutGrid },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/housekeeping', label: 'Housekeeping', icon: Sparkles },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/admin/bills', label: 'Bills', icon: FileText },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
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

  // The check for user and role is handled by the AdminProvider,
  // which shows a loading skeleton or redirects to login.
  // So, if this component renders, we can assume user and role are available.
  if (!user || !role) {
    return null;
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
        <Logo />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
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
