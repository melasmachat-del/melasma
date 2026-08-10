import { NavLink, useLocation } from 'react-router-dom';
import BrandHeader from './BrandHeader';
import { sfx } from '../lib/sound';

const NAV_ITEMS = [
  { to: '/', label: 'หน้าแรก', mobileLabel: 'หน้าแรก', icon: '⌂', match: (path: string) => path === '/' },
  { to: '/knowledge', label: 'คลังความรู้', mobileLabel: 'คลังความรู้', icon: '▤', match: (path: string) => path.startsWith('/knowledge') },
  { to: '/map', label: 'เล่นเกม', mobileLabel: 'เล่นเกม', icon: '▶', match: (path: string) => path.startsWith('/scenario') || path === '/map' },
  { to: '/chatbot', label: 'ถามเรื่องฝ้า', mobileLabel: 'ถามฝ้า', icon: '✦', match: (path: string) => path.startsWith('/chatbot') },
  { to: '/settings', label: 'ตั้งค่า', mobileLabel: 'ตั้งค่า', icon: '⚙', match: (path: string) => path.startsWith('/settings') },
];

export default function TopNavigation() {
  const { pathname } = useLocation();

  return (
    <header className="relative z-30 border-b border-sky-100 bg-white/90 shadow-[0_8px_30px_-24px_rgba(15,76,117,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-2 py-2 sm:gap-3 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:gap-2 lg:px-8 lg:py-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <BrandHeader variant="pill" />
          <p className="hidden text-right text-[10px] font-semibold leading-tight text-slate-400 sm:block lg:hidden">ศูนย์เรียนรู้<br />สุขภาพผิว</p>
        </div>
        <nav aria-label="เมนูหลัก" className="scrollbar-none -mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-0.5 lg:ml-auto lg:gap-2 lg:overflow-visible">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => sfx.click()}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-9 flex-none items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold transition sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-9 lg:px-3 lg:text-[11px] ${active ? 'bg-sky-600 text-white shadow-md' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
              >
                <span className="mr-1" aria-hidden="true">{item.icon}</span>
                <span className="sm:hidden">{item.mobileLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
