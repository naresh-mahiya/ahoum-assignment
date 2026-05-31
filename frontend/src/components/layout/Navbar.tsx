import {
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath = user?.is_creator ? '/creator' : '/dashboard';

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition ${
      isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-sky-500 text-white">
            <Sparkles size={18} />
          </span>
          <span className="text-lg">Ahoum</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Browse
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to={dashboardPath} className={navLinkClass}>
                {user?.is_creator ? 'Creator Studio' : 'My Bookings'}
              </NavLink>
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:bg-slate-50"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-600">
                      <UserIcon size={15} />
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {user?.first_name || 'Account'}
                  </span>
                  {user?.is_creator && <Badge tone="brand">Creator</Badge>}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="animate-fade-in space-y-1 border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard size={16} />
                {user?.is_creator ? 'Creator Studio' : 'My Bookings'}
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="btn-primary w-full"
            >
              Sign In
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
