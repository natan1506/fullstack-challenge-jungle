import { useEffect, useState, useCallback } from "react";

export type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _addToast: ((msg: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  _addToast?.(message, type);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => { _addToast = null; };
  }, [add]);

  const colors: Record<ToastType, string> = {
    error: "bg-red-900 border-red-600 text-red-200",
    success: "bg-green-900 border-green-600 text-green-200",
    info: "bg-gray-800 border-gray-600 text-gray-200",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in ${colors[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
