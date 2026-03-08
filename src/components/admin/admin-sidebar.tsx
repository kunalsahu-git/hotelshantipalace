'use client';

import { useState } from 'react';
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
  Menu,
} from 'lucide-react';
import { useAdmin } from './admin-provider';
import { useAuth } from '@/firebase';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
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

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { user, role } = useAdmin();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) await signOut(auth);
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} onClick={onNavigate}>
              <span
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'hover:bg-sidebar-accent/10'
                )}
              >
                <link.icon className={cn('h-5 w-5 shrink-0', isActive && 'scale-110')} />
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="p-3 rounded-md bg-sidebar-accent/5">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <Badge variant="secondary" className="capitalize mt-1">{role}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-left mt-3 p-0 h-auto hover:bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, role } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || !role) return null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems pathname={pathname} />
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border text-sidebar-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent/20"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Logo />
        <div className="w-10" /> {/* spacer to centre logo */}
      </div>

      {/* ── Mobile drawer ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="h-14 flex items-center px-6 border-b border-sidebar-border">
            <Logo />
          </div>
          <div className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
            <NavItems pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
