import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { hideToast } from '../../store/slices/uiSlice';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.activeToast);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000); // Auto-dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    error: <XCircle className="w-5 h-5 text-rose-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full animate-bounce-short">
      <div className={`flex items-start p-4 border rounded-xl shadow-lg glass-premium ${bgColors[toast.type]}`}>
        <div className="flex-shrink-0 mr-3">{icons[toast.type]}</div>
        <div className="flex-1 text-sm font-medium">{toast.message}</div>
        <button
          onClick={() => dispatch(hideToast())}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
