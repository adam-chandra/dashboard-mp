import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboard';

const items = [
  { to: '/dashboard', label: 'Sales Performance' },
  { to: '/sales-performance', label: 'Order Performance' },
  { to: '/metrics', label: 'Metrics' },
];

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 3v18h18" strokeLinecap="round" />
      <path d="M7 15l3-3 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconOrder() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

function IconMetric() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const icons: Record<string, () => JSX.Element> = {
  '/dashboard': IconChart,
  '/sales-performance': IconOrder,
  '/metrics': IconMetric,
};

export default function Sidebar() {
  const pinned = useDashboardStore((s) => s.sidebarPinned);
  const setPinned = useDashboardStore((s) => s.setSidebarPinned);
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;
  const floating = !pinned && hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group transition-all duration-200 ease-out border-r border-zinc-200 bg-white/95 backdrop-blur
        ${expanded ? 'w-60' : 'w-16'}
        ${floating ? 'shadow-xl z-50 fixed inset-y-0 left-0' : 'relative'}
      `}
    >
      <div className="h-16 flex items-center justify-between px-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <img src="/ethos_logo.png" alt="logo" className="w-8 h-8 rounded" />
          {expanded && <span className="font-bold text-zinc-800 text-sm tracking-tight">Ethos MP</span>}
        </div>
        {expanded && (
          <button
            type="button"
            onClick={() => setPinned(!pinned)}
            title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className={`p-1 rounded hover:bg-zinc-100 ${pinned ? 'text-emerald-600' : 'text-zinc-400'}`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M14 4v6l3 3v2H7v-2l3-3V4h4z" />
            </svg>
          </button>
        )}
      </div>

      <nav className="p-2 flex flex-col gap-1">
        {items.map((it) => {
          const Icon = icons[it.to];
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${isActive ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`
              }
            >
              <span className="shrink-0"><Icon /></span>
              {expanded && <span className="truncate">{it.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
