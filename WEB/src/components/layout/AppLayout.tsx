import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, CssBaseline, Drawer, IconButton, Toolbar, Avatar, Menu, MenuItem,
  Divider, ListItemIcon, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SportsBaseballOutlinedIcon from '@mui/icons-material/SportsBaseballOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupIcon from '@mui/icons-material/Group';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import Groups2Icon from '@mui/icons-material/Groups2';
import RoofingRoundedIcon from '@mui/icons-material/RoofingRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout, updateUser } from '../../features/auth/authSlice';
import { apiSlice } from '../../app/api';
import { setSelectedGroupId } from '../../features/groups/groupSlice';
import { toggleThemeMode } from '../../features/settings/themeSlice';
import { useGroupId } from '../../features/groups/useGroupId';
import { MusicPlayerDialog } from '../MusicPlayer';
import { HelpDialog } from '../HelpDialog';
import { useUpdateProfileMutation } from '../../features/users/usersApi';
import type { Language } from '../../i18n';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'nav.dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'nav.groups', path: '/groups', icon: <GroupIcon fontSize="small" />, section: 'main' },
  { label: 'nav.matches', path: '/matches', icon: <SportsSoccerOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'nav.myBets', path: '/bets', icon: <FavoriteBorderRoundedIcon fontSize="small" />, section: 'main' },
  { label: 'nav.leaderboard', path: '/leaderboard', icon: <EmojiEventsOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'nav.admin.matches', path: '/admin/matches', icon: <ManageHistoryRoundedIcon fontSize="small" />, adminOnly: true, section: 'admin' },
  { label: 'nav.admin.groups', path: '/admin/groups', icon: <RoofingRoundedIcon fontSize="small" />, adminOnly: true, section: 'admin' },
  { label: 'nav.admin.users', path: '/admin/users', icon: <ManageAccountsIcon fontSize="small" />, adminOnly: true, section: 'admin' }
];

const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '/images/en.png' },
  { code: 'vi', label: 'Tiếng Việt', flag: '/images/vi.png' },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const themeMode = useAppSelector((state) => state.theme.mode);
  const [updateProfile] = useUpdateProfileMutation();

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const { groupId, groups } = useGroupId();

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === i18n.language) || LANGUAGE_OPTIONS[0];

  const handleLanguageChange = async (lang: Language) => {
    setLangAnchorEl(null);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    dispatch(updateUser({ language: lang }));
    if (user) {
      try {
        await updateProfile({ displayName: user.displayName, avatarUrl: user.avatarUrl, language: lang });
      } catch { /* silent */ }
    }
  };

  const handleLogout = () => {
    setAnchorEl(null);
    dispatch(apiSlice.util.resetApiState());
    dispatch(setSelectedGroupId(''));
    dispatch(logout());
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdminOrManager);
  const mainItems = visibleItems.filter((item) => item.section === 'main');
  const adminItems = visibleItems.filter((item) => item.section === 'admin');

  const renderNavButton = (item: NavItem, isCollapsed: boolean) => {
    const isActive = location.pathname === item.path;
    const btn = (
      <button
        onClick={() => { navigate(item.path); setMobileOpen(false); }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-200 group
          ${isCollapsed ? 'justify-center' : ''}
          ${isActive
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
          {item.icon}
        </span>
        {!isCollapsed && t(item.label)}
        {!isCollapsed && isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
        )}
      </button>
    );
    return isCollapsed ? <Tooltip title={t(item.label)} placement="right" key={item.path}><li>{btn}</li></Tooltip> : <li key={item.path}>{btn}</li>;
  };

  const drawerContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Brand + Collapse toggle */}
      <div onClick={() => setCollapsed(!collapsed)} className={`pt-6 pb-4 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-lg text-white"><SportsBaseballOutlinedIcon /></span>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight tracking-tight">WC 2026</h1>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pb-4">
        {!isCollapsed && <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{t('nav.section.menu')}</p>}
        {isCollapsed && <div className="pt-4" />}
        <ul className="space-y-0.5">
          {mainItems.map((item) => renderNavButton(item, isCollapsed))}
        </ul>

        {adminItems.length > 0 && (
          <>
            {!isCollapsed && <p className="px-3 pt-6 pb-2 text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{t('nav.section.admin')}</p>}
            {isCollapsed && <div className="pt-4 mb-2 border-t border-gray-100 dark:border-gray-700 mx-2" />}
            <ul className="space-y-0.5">
              {adminItems.map((item) => renderNavButton(item, isCollapsed))}
            </ul>
          </>
        )}
      </nav>

      {/* Settings section at bottom */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
        {/* Help */}
        {isCollapsed ? (
          <Tooltip title={t('nav.help')} placement="right">
            <button
              onClick={() => setHelpOpen(true)}
              className="w-full flex justify-center p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <HelpOutlineOutlinedIcon fontSize="small" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => setHelpOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <HelpOutlineOutlinedIcon fontSize="small" />
            <span className="text-sm font-medium">{t('nav.help')}</span>
          </button>
        )}
        {/* Music player */}
        {isCollapsed ? (
          <Tooltip title={t('nav.playMusic')} placement="right">
            <button
              onClick={() => setMusicOpen(true)}
              className="w-full flex justify-center p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <MusicNoteOutlinedIcon fontSize="small" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => setMusicOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <MusicNoteOutlinedIcon fontSize="small" />
            <span className="text-sm font-medium">{t('nav.playMusic')}</span>
          </button>
        )}
        {/* Theme toggle */}
        {isCollapsed ? (
          <Tooltip title={themeMode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')} placement="right">
            <button
              onClick={() => dispatch(toggleThemeMode())}
              className="w-full flex justify-center p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              {themeMode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => dispatch(toggleThemeMode())}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            {themeMode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            <span className="text-sm font-medium">{themeMode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Top Bar */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: { xs: 0, sm: `${sidebarWidth}px` },
          zIndex: 40,
          height: 64,
          transition: 'left 0.3s ease',
        }}
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700">
          {/* Mobile menu + breadcrumb */}
          <div className="flex items-center gap-3 shrink-0">
            <IconButton
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { sm: 'none' }, color: 'text.primary' }}
              size="small"
            >
              <MenuIcon />
            </IconButton>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {(() => { const found = visibleItems.find((i) => i.path === location.pathname); return found ? t(found.label) : 'World Cup 2026'; })()}
              </h2>
            </div>
          </div>

          {/* Group selector — centered on mobile */}
          {groups.length > 1 && (
            <div className="flex-1 flex justify-end sm:justify-end sm:justify-end mr-3">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800 rounded-full pl-2.5 pr-1.5 py-1.5 border border-gray-200/60 dark:border-gray-600 max-w-[180px] sm:max-w-none">
                <Groups2Icon sx={{ fontSize: 16, color: '#64748b' }} className="shrink-0" />
                <select name='group-team'
                  value={groupId}
                  onChange={(e) => dispatch(setSelectedGroupId(e.target.value))}
                  className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent border-none outline-none cursor-pointer px-0.5 py-0 w-full truncate"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Language Selector */}
            <Tooltip title={t('nav.menu.language')}>
              <button
                onClick={(e) => setLangAnchorEl(e.currentTarget)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-5 object-cover rounded-full" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">{currentLang.code.toUpperCase()}</span>
              </button>
            </Tooltip>
            <Menu
              anchorEl={langAnchorEl}
              open={!!langAnchorEl}
              onClose={() => setLangAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { mt: 1, minWidth: 160, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
                },
              }}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <MenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  selected={lang.code === i18n.language}
                  sx={{ py: 1.5, px: 2.5 }}
                >
                  <img src={lang.flag} alt={lang.label} className="w-5 h-5 object-cover rounded-full mr-3" />
                  <span className="text-sm font-medium">{lang.label}</span>
                </MenuItem>
              ))}
            </Menu>

            <Tooltip title={t('nav.settings')}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <Avatar
                  src={user?.avatarUrl || undefined}
                  sx={{
                    width: 36, height: 36,
                    bgcolor: '#1a472a',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.displayName?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={!!anchorEl}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { mt: 1, minWidth: 200, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
                },
              }}
            >
              <div className="px-4 py-3">
                <p className="text-sm font-semibold" style={{ color: 'inherit' }}>{user?.displayName}</p>
                <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{user?.email}</p>
              </div>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ py: 1.5, px: 2.5 }}>
                <ListItemIcon><PersonOutlinedIcon fontSize="small" /></ListItemIcon>
                <span className="text-sm">{t('nav.menu.profile')}</span>
              </MenuItem>
              {user?.authProvider === 'Local' && (
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/change-password'); }} sx={{ py: 1.5, px: 2.5 }}>
                  <ListItemIcon><LockOutlinedIcon fontSize="small" /></ListItemIcon>
                  <span className="text-sm">{t('nav.menu.changePassword')}</span>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2.5, color: 'error.main' }}>
                <ListItemIcon><LogoutOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                <span className="text-sm">{t('nav.menu.logout')}</span>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Box>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { xs: 0, sm: sidebarWidth },
          flexShrink: { sm: 0 },
          transition: 'width 0.3s ease',
        }}
      >
        {/* Mobile drawer — always full width */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>
        {/* Desktop drawer — collapsible */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              bgcolor: 'background.paper',
            },
          }}
          open
        >
          {drawerContent(collapsed)}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          height: { xs: '100dvh', sm: '100vh' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
          <Outlet />
        </div>
      </Box>

      {/* Music Player Dialog */}
      <MusicPlayerDialog open={musicOpen} onClose={() => setMusicOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
}
