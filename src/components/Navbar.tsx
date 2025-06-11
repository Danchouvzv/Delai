// components/Navbar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoSvg from '../screenshots/logo.svg'; // Импортируем SVG-логотип
import ChatNotifications from './ChatNotifications';
import { Menu, MenuItem } from '@headlessui/react';
import { HStack, Text } from '@chakra-ui/react';
import { FaRobot, FaFileAlt, FaFilePdf, FaNetworkWired, FaTasks } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && prefersDark);
    }
    return false;
  });

  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        avatarRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    
    // Close menu on route change
    const handleRouteChange = () => {
      setUserMenuOpen(false);
    };

    // Handle escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Close user menu on location change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'text-primary dark:text-primary font-medium border-b-2 border-primary pb-1'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors';
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting to logout...');
      if (logout) {
        await logout();
        console.log('Logout successful, redirecting to login page...');
        // Close mobile menu if it's open
        setMenuOpen(false);
        setUserMenuOpen(false);
        // Use navigate to redirect to login page
        navigate('/login', { replace: true });
      } else {
        console.error('Logout function is not available');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={`text-sm font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
          location.pathname === "/" 
            ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400' 
            : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Главная
      </Link>
      
     
      
      {/* Вакансии и работа - выпадающее меню */}
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button
              className={`text-sm font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
                ['/jobs', '/company', '/resume-generator', '/subscription'].includes(location.pathname)
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400' 
                  : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Карьера
              <svg className={`w-4 h-4 ml-1 transform ${open ? 'rotate-180' : 'rotate-0'} transition-transform`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </Menu.Button>
            <Menu.Items className="absolute left-0 mt-1 w-56 origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-slate-700 z-50">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
      <Link
        to="/jobs"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
        onClick={() => setMenuOpen(false)}
      >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
        Вакансии
      </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
      <Link
        to="/resume-generator"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
        onClick={() => setMenuOpen(false)}
      >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
        Генератор резюме
      </Link>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/company"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Для работодателей
                    </Link>
                  )}
                </Menu.Item>
                
                {/* Ссылка на страницу заявок - только для работодателей */}
                {(userData?.role === 'employer' || userData?.role === 'business' || userData?.role === 'admin') && (
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/employer/applications"
                        className={`${
                          active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                        } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Заявки на вакансии
                      </Link>
                    )}
                  </Menu.Item>
                )}
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/subscription"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Тарифы
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </>
        )}
      </Menu>
      
      {/* Микрозадания - отдельная ссылка */}
      
      
      {/* ИИ Сервисы - выпадающее меню */}
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button
              className={`text-sm font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
                ['/ai-mentor'].includes(location.pathname)
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400' 
                  : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="hidden md:inline">AI Сервисы</span>
              <span className="inline md:hidden">AI</span>
              <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full">NEW</span>
              <svg className={`w-4 h-4 ml-1 transform ${open ? 'rotate-180' : 'rotate-0'} transition-transform`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </Menu.Button>
            <Menu.Items className="absolute left-0 mt-1 w-56 origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
      <Link
        to="/ai-mentor"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
        onClick={() => setMenuOpen(false)}
      >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
        AI Ментор
      </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/resume-review"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Проверка резюме
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/networking"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } group flex items-center px-4 py-2 text-sm`}
                    >
                      <svg className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Нетворкинг
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full">Новое</span>
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/microtasks"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } group flex items-center px-4 py-2 text-sm`}
                    >
                      <svg className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Микрозадания
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full">Новое</span>
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </>
        )}
      </Menu>
      
      {/* О нас и контакты - выпадающее меню */}
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button
              className={`text-sm font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
                ['/about', '/contact'].includes(location.pathname)
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400' 
                  : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              О нас
              <svg className={`w-4 h-4 ml-1 transform ${open ? 'rotate-180' : 'rotate-0'} transition-transform`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </Menu.Button>
            <Menu.Items className="absolute left-0 mt-1 w-56 origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
      <Link
        to="/about"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      О проекте
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/faq"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
        onClick={() => setMenuOpen(false)}
      >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      FAQ
      </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
      <Link
        to="/contact"
                      className={`${
                        active ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      } flex items-center rounded-md px-3 py-2 text-sm transition-colors`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Связаться с нами
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </>
        )}
      </Menu>
      
      {/* Админ-панель - только для администраторов */}
      {user && userData?.role === 'admin' && (
        <Link
          to="/admin"
          className={`text-sm font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
            location.pathname.startsWith("/admin") 
              ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400' 
              : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800'
          }`}
        onClick={() => setMenuOpen(false)}
      >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Админ-панель
      </Link>
      )}
    </>
  );

  // User actions
  const UserActions = () => user ? (
    <div className="flex items-center gap-4">
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark transition-colors flex items-center justify-center"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Chat notifications */}
      <div className="w-10 h-10 flex items-center justify-center">
        <ChatNotifications />
      </div>

      {/* User avatar with dropdown */}
      <div className="relative">
        <button
          ref={avatarRef}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          aria-haspopup="true"
          aria-expanded={userMenuOpen}
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>

        {/* User dropdown menu */}
        {userMenuOpen && (
          <div 
            ref={userMenuRef}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-lighter rounded-lg shadow-lg py-1 border border-gray-200 dark:border-dark-border z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Профиль
            </Link>
            <Link
              to="/chats"
              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Сообщения
            </Link>
            
            {/* Ссылка на заявки для работодателей */}
            {(userData?.role === 'employer' || userData?.role === 'business' || userData?.role === 'admin') && (
              <Link
                to="/employer/applications"
                className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Заявки на вакансии
              </Link>
            )}
            
            {/* Admin Panel Link - Only visible for admin users */}
            {userData?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Админ-панель
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выход
            </button>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-4">
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark transition-colors flex items-center justify-center"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <Link
        to="/login"
        className="text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        Войти
      </Link>
      <Link
        to="/signup"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all duration-200"
        onClick={() => setMenuOpen(false)}
      >
        Регистрация
      </Link>
    </div>
  );

  // Mobile menu items for user
  const mobilUserMenu = user ? (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-dark-border space-y-4">
      <Link
        to="/profile"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        Профиль
      </Link>
      <Link
        to="/chats"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        Сообщения
      </Link>
      
      {/* Admin Panel Link - Only visible for admin users */}
      {userData?.role === 'admin' && (
        <Link
          to="/admin"
          className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
          onClick={() => setMenuOpen(false)}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Админ-панель
        </Link>
      )}
      
      <button
        onClick={() => {
          handleLogout();
          setMenuOpen(false);
        }}
        className="w-full flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        Выход
      </button>
    </div>
  ) : (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-dark-border flex flex-col space-y-3">
      <Link
        to="/login"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Войти
      </Link>
      <Link
        to="/signup"
        className="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md transition-all"
        onClick={() => setMenuOpen(false)}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Регистрация
      </Link>
    </div>
  );

  return (
    <header className="bg-white dark:bg-dark-lighter backdrop-blur-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-40 shadow-sm animate-fadeInUp">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 opacity-50"></div>
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  {isDarkMode ? (
                    "J"
                  ) : (
                    <img src={logoSvg} alt="JumysAL Logo" className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  JumysAL
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8 items-center">
              <NavLinks />
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <UserActions />
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border mr-2 flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 w-10 h-10 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transform ${menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} transition-opacity transition-transform duration-300 ease-in-out`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}></div>
        <div className="relative bg-white dark:bg-dark-lighter min-h-screen w-full max-w-sm p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
              <img src={logoSvg} alt="JumysAl" className="h-8" />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">
            <NavLinks />
          </div>
          {mobilUserMenu}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
