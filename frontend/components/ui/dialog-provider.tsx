"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */
type DialogType = "alert" | "confirm" | "danger";

interface DialogState {
  type: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  showAlert: (message: string, title?: string) => Promise<boolean>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showDanger: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within <DialogProvider>");
  return ctx;
}

/* ──────────────────────────────────────────────────────────────
   Provider
   ────────────────────────────────────────────────────────────── */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [visible, setVisible] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const open = useCallback(
    (type: DialogType, message: string, title?: string) =>
      new Promise<boolean>((resolve) => {
        setDialog({
          type,
          title:
            title ||
            (type === "alert"
              ? "Thông báo"
              : type === "danger"
                ? "Cảnh báo"
                : "Xác nhận"),
          message,
          confirmText: type === "alert" ? "Đã hiểu" : "Xác nhận",
          cancelText: "Hủy",
          resolve,
        });
        // Trigger enter animation on next frame
        requestAnimationFrame(() => setVisible(true));
      }),
    [],
  );

  const close = useCallback(
    (result: boolean) => {
      setVisible(false);
      // Wait for exit animation before unmounting
      setTimeout(() => {
        dialog?.resolve(result);
        setDialog(null);
      }, 200);
    },
    [dialog],
  );

  const showAlert = useCallback(
    (message: string, title?: string) => open("alert", message, title),
    [open],
  );
  const showConfirm = useCallback(
    (message: string, title?: string) => open("confirm", message, title),
    [open],
  );
  const showDanger = useCallback(
    (message: string, title?: string) => open("danger", message, title),
    [open],
  );

  const iconMap: Record<DialogType, React.ReactNode> = {
    alert: (
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    confirm: (
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    danger: (
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showDanger }}>
      {children}

      {dialog &&
        createPortal(
          <div
            ref={backdropRef}
            data-modal-portal="true"
            className={`fixed inset-0 z-[999999] grid place-items-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === backdropRef.current) close(false);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-2xl transition-all duration-200 dark:border-dark-3 dark:bg-gray-dark ${
                visible
                  ? "scale-100 opacity-100 translate-y-0"
                  : "scale-95 opacity-0 translate-y-2"
              }`}
            >
              {/* Icon */}
              <div className="mb-4">{iconMap[dialog.type]}</div>

              {/* Title */}
              <h3 className="text-center text-lg font-bold text-dark dark:text-white">
                {dialog.title}
              </h3>

              {/* Message */}
              <p className="mt-2 text-center text-sm leading-relaxed text-dark-5 dark:text-dark-6">
                {dialog.message}
              </p>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {dialog.type !== "alert" && (
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="rounded-xl border border-stroke bg-white px-5 py-2.5 text-sm font-bold text-dark-5 transition hover:bg-gray-2 active:scale-95 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6 dark:hover:bg-dark-3"
                  >
                    {dialog.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
                    dialog.type === "danger"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DialogContext.Provider>
  );
}
