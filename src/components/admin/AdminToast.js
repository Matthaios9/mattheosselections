'use client';

import { createContext, useContext, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { PiCheckCircleFill, PiWarningCircleFill } from 'react-icons/pi';

const ToastContext = createContext(() => {});

/** `const notify = useAdminToast(); notify('Saved')` or `notify('Failed', 'danger')`. */
export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = (message, variant = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-3), { id, message, variant }]);
  };

  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastContainer position="bottom-end" containerPosition="fixed" className="p-3" style={{ zIndex: 1090 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} onClose={() => dismiss(toast.id)} delay={4000} autohide className="border-0 shadow">
            <Toast.Body className="d-flex align-items-center gap-2 fw-semibold">
              {toast.variant === 'danger' ? (
                <PiWarningCircleFill className="text-danger fs-5 flex-shrink-0" aria-hidden="true" />
              ) : (
                <PiCheckCircleFill className="text-success fs-5 flex-shrink-0" aria-hidden="true" />
              )}
              <span>{toast.message}</span>
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  return useContext(ToastContext);
}
