// NotificationToast - Toast notification display component

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppContext, Notification } from '@/contexts/AppContext';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const colors: Record<NotificationType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
};

function Toast({ notification }: { notification: Notification }) {
  const { dismissNotification } = useAppContext();

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-lg animate-slide-in-right"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${colors[notification.type]}`,
        minWidth: '320px',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-2)',
      }}
    >
      <div style={{ color: colors[notification.type], flexShrink: 0 }}>
        {icons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '14px' }}>
          {notification.title}
        </p>
        {notification.message && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {notification.message}
          </p>
        )}
      </div>
      <button
        onClick={() => dismissNotification(notification.id)}
        className="p-1 rounded hover:bg-[var(--color-background)] transition-colors flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications } = useAppContext();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast notification={notification} />
        </div>
      ))}
    </div>
  );
}
