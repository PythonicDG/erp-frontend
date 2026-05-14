'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ExternalLink, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ShieldAlert,
  ChevronRight,
  X
} from 'lucide-react';
import { notificationService, Notification, NotificationType } from '@/services/notification-service';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-rose-500" />,
  approval_request: <ShieldAlert className="h-4 w-4 text-purple-500" />,
  approval_action: <CheckCheck className="h-4 w-4 text-blue-600" />,
};

const NOTIFICATION_BG: Record<NotificationType, string> = {
  info: 'bg-blue-50',
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  error: 'bg-rose-50',
  approval_request: 'bg-purple-50',
  approval_action: 'bg-blue-50',
};

export function NotificationDropdown() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      // Silently fail polling
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleClearAll = async () => {
    try {
      // For simplicity, we'll mark all as read and then delete or just call a bulk delete if available
      // Since we don't have bulk delete yet, we can clear the state and let the user delete manually or just mark all read
      // Actually, I'll just clear the local state for a better UX and then mark all as read on backend
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Don't trigger the notification click
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === id && !n.is_read);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Make it vanish immediately from the UI
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    setUnreadCount(prev => notification.is_read ? prev : Math.max(0, prev - 1));

    try {
      // Mark as read and then delete on backend so it "vanishes"
      await notificationService.markAsRead(notification.id);
      await notificationService.delete(notification.id);
    } catch (error) {
      // Backend sync failed
    }

    if (notification.link) {
      const rolePrefix = `/${user?.role?.toLowerCase() || 'employee'}`;
      const finalLink = notification.link.startsWith('/') 
        ? `${rolePrefix}${notification.link}`
        : `${rolePrefix}/${notification.link}`;
      router.push(finalLink);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="navbar-icon-btn relative group" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={18} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-blue-600 text-[10px] py-0 h-4 px-1.5">{unreadCount} New</Badge>
              )}
            </div>
            <button 
              onClick={handleClearAll}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear All
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${NOTIFICATION_BG[notification.notification_type]}`}>
                        {NOTIFICATION_ICONS[notification.notification_type]}
                      </div>
                      <div className="space-y-1 overflow-hidden flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-xs font-bold truncate ${notification.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                              {formatTimeAgo(new Date(notification.created_at))}
                            </span>
                            <button 
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.link && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                            View Details <ChevronRight size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Bell size={32} className="opacity-20 mb-3" />
                <p className="text-xs italic">No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 border-t text-center">
            <button 
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${className}`}>
      {children}
    </span>
  );
}
