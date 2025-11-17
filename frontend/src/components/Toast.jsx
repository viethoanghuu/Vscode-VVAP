import React, { useEffect } from "react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const cls = `toast ${toast.type === "success" ? "toast--success" : "toast--error"}`;

  return (
    <div className={cls} role="status" aria-live="polite">
      <div className="toast-body">
        <div className="toast-message">{toast.message}</div>
        <button
          className="toast-close"
          aria-label="Close notification"
          onClick={() => onClose && onClose()}
        >
          ×
        </button>
      </div>
    </div>
  );
}
