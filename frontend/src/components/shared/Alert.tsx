import React, { useEffect } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

const ALERT_COLORS: Record<AlertType, { bg: string; color: string; border: string }> = {
  success: { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
  error: { bg: '#ffebee', color: '#c62828', border: '#ffcdd2' },
  warning: { bg: '#fef9ef', color: '#e65100', border: '#ffe0b2' },
  info: { bg: '#eef6fc', color: '#01579b', border: '#b3e5fc' },
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose, autoClose }) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const colors = ALERT_COLORS[type];

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 8,
      marginBottom: 16,
      background: colors.bg,
      color: colors.color,
      fontSize: 14,
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.color,
            fontSize: 18,
            lineHeight: 1,
            padding: '0 4px',
            opacity: 0.7,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
