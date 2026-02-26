'use client';

import { Sidebar } from './sidebar';
import { MobileMenu } from './mobile-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <MobileMenu />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-sm shadow-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 22h12V8l-4-4H3z"/><path d="M11 4v4h4"/><path d="M21 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"/><path d="M7 15h4"/></svg>
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-slate-900">
                  FuelRed
                </h1>
                <p className="text-[10px] font-medium text-slate-400 -mt-0.5">
                  Sistema de Monitoreo
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
