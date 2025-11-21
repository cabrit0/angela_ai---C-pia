import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';

interface SecondaryNavProps {
  pendingPublicSharesCount?: number;
}

const SecondaryNav: React.FC<SecondaryNavProps> = ({ pendingPublicSharesCount = 0 }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  
  if (!isTeacher && !isAdmin) {
    return null;
  }
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navLinkClass = (path: string) => {
    const base = "btn-hover-bounce nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200";
    return isActive(path) ? `${base} nav-link-active` : base;
  };
  
  return (
    <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isTeacher && (
          <>
            <Link to="/public-quizzes" className={navLinkClass('/public-quizzes')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium hidden lg:inline">Públicos</span>
            </Link>

            <Link to="/classes" className={navLinkClass('/classes')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-medium hidden lg:inline">Turmas</span>
            </Link>

            <Link to="/assignments" className={navLinkClass('/assignments')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm font-medium hidden lg:inline">Assignments</span>
            </Link>

            <Link to="/shared" className={navLinkClass('/shared')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium hidden lg:inline">Compartilhados</span>
            </Link>

            <Link to="/reports" className={navLinkClass('/reports')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium hidden lg:inline">Relatórios</span>
            </Link>
          </>
        )}

        {isAdmin && (
          <Link to="/admin/public-shares" className={navLinkClass('/admin/public-shares')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium hidden lg:inline">Aprovar Públicos</span>
            {pendingPublicSharesCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                {pendingPublicSharesCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default SecondaryNav;

