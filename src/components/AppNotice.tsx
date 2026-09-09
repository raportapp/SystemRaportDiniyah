import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
export default function AppNotice() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const notice = (event: Event) =>
      setMessage((event as CustomEvent<string>).detail);
    const rejection = (event: PromiseRejectionEvent) => {
      setMessage(
        event.reason instanceof Error
          ? event.reason.message
          : 'Tindakan gagal. Silakan coba lagi.',
      );
      event.preventDefault();
    };
    window.addEventListener('raport-notice', notice);
    window.addEventListener('unhandledrejection', rejection);
    return () => {
      window.removeEventListener('raport-notice', notice);
      window.removeEventListener('unhandledrejection', rejection);
    };
  }, []);
  return message ? (
    <div className="app-notice" role="alert">
      <AlertCircle size={20} />
      <p>{message}</p>
      <button aria-label="Tutup pemberitahuan" onClick={() => setMessage('')}>
        <X size={18} />
      </button>
    </div>
  ) : null;
}
