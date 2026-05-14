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
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import Groups2Icon from '@mui/icons-material/Groups2';
import RoofingRoundedIcon from '@mui/icons-material/RoofingRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { apiSlice } from '../../app/api';
import { setSelectedGroupId } from '../../features/groups/groupSlice';
import { useGroupId } from '../../features/groups/useGroupId';
import { MusicPlayer } from '../MusicPlayer';

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
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'Groups', path: '/groups', icon: <GroupIcon fontSize="small" />, section: 'main' },
  { label: 'Matches', path: '/matches', icon: <SportsSoccerOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'My Bets', path: '/bets', icon: <FavoriteBorderRoundedIcon fontSize="small" />, section: 'main' },
  { label: 'Leaderboard', path: '/leaderboard', icon: <EmojiEventsOutlinedIcon fontSize="small" />, section: 'main' },
  { label: 'Manage Matches', path: '/admin/matches', icon: <ManageHistoryRoundedIcon fontSize="small" />, adminOnly: true, section: 'admin' },
  { label: 'Manage Groups', path: '/admin/groups', icon: <RoofingRoundedIcon fontSize="small" />, adminOnly: true, section: 'admin' },
  { label: 'Manage Users', path: '/admin/users', icon: <ManageAccountsIcon fontSize="small" />, adminOnly: true, section: 'admin' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const { groupId, groups } = useGroupId();

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

  const renderNavButton = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const btn = (
      <button
        onClick={() => { navigate(item.path); setMobileOpen(false); }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-200 group
          ${collapsed ? 'justify-center' : ''}
          ${isActive
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }
        `}
      >
        <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {item.icon}
        </span>
        {!collapsed && item.label}
        {!collapsed && isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
        )}
      </button>
    );
    return collapsed ? <Tooltip title={item.label} placement="right" key={item.path}><li>{btn}</li></Tooltip> : <li key={item.path}>{btn}</li>;
  };

  const drawerContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand + Collapse toggle */}
      <div onClick={() => setCollapsed(!collapsed)} className={`pt-6 pb-4 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-lg text-white"><SportsBaseballOutlinedIcon /></span>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-800 leading-tight tracking-tight">WC 2026</h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pb-4">
        {!isCollapsed && <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Menu</p>}
        {isCollapsed && <div className="pt-4" />}
        <ul className="space-y-0.5">
          {mainItems.map(renderNavButton)}
        </ul>

        {adminItems.length > 0 && (
          <>
            {!isCollapsed && <p className="px-3 pt-6 pb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Admin</p>}
            {isCollapsed && <div className="pt-4 mb-2 border-t border-gray-100 mx-2" />}
            <ul className="space-y-0.5">
              {adminItems.map(renderNavButton)}
            </ul>
          </>
        )}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-gray-100">
        {isCollapsed ? (
          <Tooltip title="Logout" placement="right">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogoutOutlinedIcon fontSize="small" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogoutOutlinedIcon fontSize="small" />
            <span className="text-sm font-medium">Logout</span>
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
        <div className="h-full px-4 sm:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100">
          {/* Mobile menu + breadcrumb */}
          <div className="flex items-center gap-3 flex-1">
            <IconButton
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { sm: 'none' }, color: 'text.primary' }}
              size="small"
            >
              <MenuIcon />
            </IconButton>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-800">
                {visibleItems.find((i) => i.path === location.pathname)?.label ?? 'World Cup 2026'}
              </h2>
            </div>
          </div>

          {/* Center - Music Player */}
          <div className="flex-1 flex justify-center">
            <MusicPlayer />
          </div>

          {/* Right actions */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {groups.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-full pl-2 pr-1 py-0.5 border border-gray-200/60">
                <Groups2Icon sx={{ fontSize: 16, color: '#64748b' }} />
                <select name='group-team'
                  value={groupId}
                  onChange={(e) => dispatch(setSelectedGroupId(e.target.value))}
                  className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer p-[0.4rem] w-auto"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isAdminOrManager && (
              <Tooltip title="Admin">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 14 }} />
                  {user?.role}
                </span>
              </Tooltip>
            )}

            <Tooltip title="Account">
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
                <p className="text-sm font-semibold text-gray-800">{user?.displayName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ py: 1.5, px: 2.5 }}>
                <ListItemIcon><PersonOutlinedIcon fontSize="small" /></ListItemIcon>
                <span className="text-sm">Profile</span>
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2.5, color: 'error.main' }}>
                <ListItemIcon><LogoutOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                <span className="text-sm">Logout</span>
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
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
