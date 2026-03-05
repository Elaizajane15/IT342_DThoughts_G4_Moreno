import { useEffect } from 'react';

export default function Toast({ message, type = 'success', duration = 5000, onClose }) {
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && '✓ '}
      {type === 'error' && '⚠️ '}
      {message}
    </div>
  );
}
