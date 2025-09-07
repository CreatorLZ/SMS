"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastProps = {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose?: () => void;
};

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [show, setShow] = useState(true);

  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let closedByTimer = false;
    const timer = setTimeout(() => {
      closedByTimer = true;
      setShow(false);
      onCloseRef.current?.();
    }, duration);

    return () => {
      clearTimeout(timer);
      // Don't trigger onClose during cleanup unless timer triggered it
      if (!closedByTimer) {
        setShow(false);
      }
    };
  }, [duration]); // removed onClose from deps since we use ref

  const baseClasses =
    "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] z-50";
  const typeClasses = {
    success: "bg-green-50 text-green-800 border border-green-200",
    error: "bg-red-50 text-red-800 border border-red-200",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
          aria-live="polite"
          className={`${baseClasses} ${typeClasses[type]}`}
        >
          <span className="flex-1">{message}</span>
          <button
            onClick={() => setShow(false)}
            className="hover:opacity-70 transition-opacity"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
