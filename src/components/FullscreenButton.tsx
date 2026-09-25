import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface FullscreenButtonProps {
  className?: string;
  showLabel?: boolean;
}

interface ToastInfo {
  title: string;
  sub?: string;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  className = "",
  showLabel = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToggleRef = useRef(0);

  const isMobileOrIOS = useCallback((): boolean => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
    const isTouchMobile =
      isIOSDevice ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      ("ontouchstart" in window) ||
      ((navigator.maxTouchPoints || 0) > 0 && window.innerWidth <= 1024);
    return isTouchMobile;
  }, []);

  const isStandalone = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    const nav = window.navigator as any;
    return (
      nav.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  }, []);

  const checkIsFullscreen = useCallback((): boolean => {
    if (typeof document === "undefined") return false;
    const doc = document as any;
    const isNative = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    const isSimulated = document.documentElement.classList.contains("simulated-fullscreen");
    return isNative || isSimulated;
  }, []);

  const triggerHaptic = useCallback((ms = 18) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
        navigator.vibrate(ms);
      }
    } catch {}
  }, []);

  const showToastMsg = useCallback((title: string, sub?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ title, sub });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const applySimulatedFullscreen = useCallback((enable: boolean) => {
    if (enable) {
      document.documentElement.classList.add("simulated-fullscreen");
      document.body.classList.add("simulated-fullscreen");
      setIsFullscreen(true);
      try {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 50);
      } catch {}
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new CustomEvent("fullscreen-mode-change", { detail: { isFullscreen: true } }));
    } else {
      document.documentElement.classList.remove("simulated-fullscreen");
      document.body.classList.remove("simulated-fullscreen");
      setIsFullscreen(false);
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new CustomEvent("fullscreen-mode-change", { detail: { isFullscreen: false } }));
    }
  }, []);

  useEffect(() => {
    const updateFsState = () => {
      setIsFullscreen(checkIsFullscreen());
    };

    const handleOpenModal = () => {
      applySimulatedFullscreen(true);
      window.dispatchEvent(new CustomEvent("open-phone-tips"));
      window.dispatchEvent(new CustomEvent("open-orientation-guide"));
    };

    updateFsState();
    document.addEventListener("fullscreenchange", updateFsState);
    document.addEventListener("webkitfullscreenchange", updateFsState);
    document.addEventListener("mozfullscreenchange", updateFsState);
    document.addEventListener("MSFullscreenChange", updateFsState);
    window.addEventListener("fullscreen-mode-change", updateFsState);
    window.addEventListener("open-ios-fs-modal", handleOpenModal);

    return () => {
      document.removeEventListener("fullscreenchange", updateFsState);
      document.removeEventListener("webkitfullscreenchange", updateFsState);
      document.removeEventListener("mozfullscreenchange", updateFsState);
      document.removeEventListener("MSFullscreenChange", updateFsState);
      window.removeEventListener("fullscreen-mode-change", updateFsState);
      window.removeEventListener("open-ios-fs-modal", handleOpenModal);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [checkIsFullscreen, applySimulatedFullscreen]);

  const handleToggle = useCallback(
    async (e: React.SyntheticEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // Debounce fast multi-event touch/click triggers (250ms)
      const now = Date.now();
      if (now - lastToggleRef.current < 250) return;
      lastToggleRef.current = now;

      triggerHaptic(20);

      // On mobile / iPhone: ALWAYS show the comprehensive guide modal with Rotate & 100% Fullscreen steps
      if (isMobileOrIOS()) {
        applySimulatedFullscreen(true);
        window.dispatchEvent(new CustomEvent("open-phone-tips"));
        window.dispatchEvent(new CustomEvent("open-orientation-guide"));
        return;
      }

      const currentlyFs = checkIsFullscreen();
      const doc = document as any;
      const docEl = document.documentElement as any;

      if (currentlyFs) {
        // EXIT FULLSCREEN
        try {
          if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            if (doc.exitFullscreen) await doc.exitFullscreen();
            else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
          }
        } catch (err) {
          console.warn("Native exit fullscreen error:", err);
        }

        applySimulatedFullscreen(false);
        showToastMsg("WINDOWED MODE");
        return;
      }

      // ENTER FULLSCREEN
      // Case A: User is already playing from Home Screen (iOS Standalone PWA)
      if (isStandalone()) {
        showToastMsg("ALREADY FULLSCREEN", "Game running in Fullscreen Standalone App mode!");
        applySimulatedFullscreen(true);
        return;
      }

      // Case B: Desktop browsers with native Fullscreen API support
      let nativeSucceeded = false;
      try {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen({ navigationUI: "hide" });
          nativeSucceeded = true;
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
          nativeSucceeded = true;
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
          nativeSucceeded = true;
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
          nativeSucceeded = true;
        }
      } catch (err) {
        console.warn("Native fullscreen rejected, applying immersive fallback:", err);
      }

      applySimulatedFullscreen(true);
      if (nativeSucceeded) {
        showToastMsg("FULLSCREEN MODE ACTIVE");
      } else {
        showToastMsg("IMMERSIVE MODE ACTIVE", "Display expanded to fill browser viewport");
      }
    },
    [checkIsFullscreen, isMobileOrIOS, isStandalone, triggerHaptic, applySimulatedFullscreen, showToastMsg]
  );

  return (
    <>
      <button
        type="button"
        className={`btn-fullscreen-toggle ${isFullscreen ? "is-fullscreen" : ""} ${className}`}
        onClick={handleToggle}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        <span className="fs-icon-wrap">
          {isFullscreen ? (
            /* Compress / Exit Fullscreen SVG Icon */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            /* Expand / Enter Fullscreen SVG Icon */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
            </svg>
          )}
        </span>
        {showLabel && (
          <span className="fs-btn-label">
            {isFullscreen ? "WINDOWED" : "FULLSCREEN"}
          </span>
        )}
      </button>

      {/* Broadcast Toast Notification — Portaled to body to escape all stacking contexts */}
      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fs-toast-alert animate-fade-in" role="status" aria-live="polite">
            <div className="fs-toast-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27e5ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
              </svg>
              <span>{toast.title}</span>
            </div>
            {toast.sub && <div className="fs-toast-sub">{toast.sub}</div>}
          </div>,
          document.body
        )}

    </>
  );
};

export default FullscreenButton;
