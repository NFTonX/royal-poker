import React, { useEffect } from 'react';
import { ToastNotification } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        return (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        );
      })}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration || 3500;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const config = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-slate-950/95 shadow-[0_8px_25px_rgba(16,185,129,0.25)]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      titleColor: 'text-emerald-300'
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-slate-950/95 shadow-[0_8px_25px_rgba(244,63,94,0.25)]',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      titleColor: 'text-rose-300'
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-slate-950/95 shadow-[0_8px_25px_rgba(245,158,11,0.25)]',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      titleColor: 'text-amber-300'
    },
    info: {
      border: 'border-cyan-500/40',
      bg: 'bg-slate-950/95 shadow-[0_8px_25px_rgba(6,182,212,0.25)]',
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
      titleColor: 'text-cyan-300'
    }
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 animate-slide-up ${config.bg} ${config.border}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 flex flex-col">
        {toast.title && (
          <span className={`text-xs font-bold ${config.titleColor}`}>
            {toast.title}
          </span>
        )}
        <span className="text-xs text-slate-200 leading-snug">
          {toast.message}
        </span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-500 hover:text-slate-300 active:scale-95 transition-all -mr-1 -mt-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
