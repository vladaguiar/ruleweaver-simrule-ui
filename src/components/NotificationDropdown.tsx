// NotificationDropdown - Displays notification history in a dropdown menu

import React from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppContext, type Notification } from '@/contexts/AppContext';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    dismissNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useAppContext();

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  // Format timestamp relative to now
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 rounded-lg overflow-hidden z-50"
      style={{
        backgroundColor: 'var(--color-background)',
        boxShadow: 'var(--shadow-3)',
        border: '1px solid var(--color-border)',
        maxHeight: '500px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded transition-colors"
              title="Clear all notifications"
            >
              <Trash2 size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded transition-colors ml-1"
            title="Close"
          >
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 px-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Bell size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <span style={{ fontSize: '14px' }}>No notifications</span>
            <span style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
              You're all caught up!
            </span>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: notification.read ? 'transparent' : 'var(--color-surface)',
                }}
                onClick={() => markAsRead(notification.id)}
              >
                {/* Unread indicator */}
                <div className="flex-shrink-0 mt-1">
                  {!notification.read ? (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                  ) : (
                    <div className="w-2 h-2" />
                  )}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{
                      fontSize: '13px',
                      fontWeight: notification.read ? 400 : 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {notification.title}
                  </div>
                  {notification.message && (
                    <div
                      className="mt-0.5 line-clamp-2"
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {notification.message}
                    </div>
                  )}
                  <div
                    className="mt-1 flex items-center gap-2"
                    style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                  >
                    <span>{formatTimestamp(notification.timestamp)}</span>
                    {notification.category && (
                      <>
                        <span>•</span>
                        <span style={{ textTransform: 'capitalize' }}>{notification.category}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-1 hover:bg-[var(--color-surface-hover)] rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="p-1 hover:bg-[var(--color-surface-hover)] rounded transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Optional: Settings link */}
      {notifications.length > 0 && (
        <div
          className="px-4 py-2 text-center"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
