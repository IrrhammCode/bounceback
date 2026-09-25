import React, { useState, useEffect, useCallback, useRef } from "react";

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

  const triggerHaptic = useCallback((ms = 15) => {
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
    }, 2800);
  }, []);

  useEffect(() => {
    const updateFsState = () => {
      setIsFullscreen(checkIsFullscreen());
    };

    updateFsState();
    document.addEventListener("fullscreenchange", updateFsState);
    document.addEventListener("webkitfullscreenchange", updateFsState);
    document.addEventListener("mozfullscreenchange", updateFsState);
    document.addEventListener("MSFullscreenChange", updateFsState);
    window.addEventListener("fullscreen-mode-change", updateFsState);

    return () => {
      document.removeEventListener("fullscreenchange", updateFsState);
      document.removeEventListener("webkitfullscreenchange", updateFsState);
      document.removeEventListener("mozfullscreenchange", updateFsState);
      document.removeEventListener("MSFullscreenChange", updateFsState);
      window.removeEventListener("fullscreen-mode-change", updateFsState);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [checkIsFullscreen]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      triggerHaptic(18);

      const doc = document as any;
      const docEl = document.documentElement as any;
      const currentlyFs = checkIsFullscreen();

      const isIOS =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

      if (currentlyFs) {
        // EXIT FULLSCREEN
        try {
          if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            if (doc.exitFullscreen) {
              await doc.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
              await doc.webkitExitFullscreen();
            } else if (doc.mozCancelFullScreen) {
              await doc.mozCancelFullScreen();
            } else if (doc.msExitFullscreen) {
              await doc.msExitFullscreen();
            }
          }
        } catch (err) {
          console.warn("Native exit fullscreen error:", err);
        }

        // Clean up simulated fullscreen
        document.documentElement.classList.remove("simulated-fullscreen");
        document.body.classList.remove("simulated-fullscreen");
        setIsFullscreen(false);
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new CustomEvent("fullscreen-mode-change", { detail: { isFullscreen: false } }));
        showToastMsg("MODE JENDELA (WINDOWED)");
      } else {
        // ENTER FULLSCREEN
        let nativeSucceeded = false;

        // Try native Fullscreen API first (works on Android Chrome, Desktop browsers, iPadOS)
        if (!isIOS) {
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
            console.warn("Native requestFullscreen rejected, falling back to simulated immersive mode:", err);
          }
        }

        // Fallback to simulated immersive fullscreen (especially for iOS Safari & restricted iframes)
        if (!nativeSucceeded) {
          document.documentElement.classList.add("simulated-fullscreen");
          document.body.classList.add("simulated-fullscreen");
          setIsFullscreen(true);
          try {
            window.scrollTo(0, 1);
            setTimeout(() => window.scrollTo(0, 0), 60);
          } catch {}
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new CustomEvent("fullscreen-mode-change", { detail: { isFullscreen: true } }));

          if (isIOS) {
            showToastMsg(
              "LAYAR PENUH AKTIF",
              "Tip iOS: Buka Share > Add to Home Screen untuk 100% tanpa bar browser"
            );
          } else {
            showToastMsg("LAYAR PENUH AKTIF", "Tekan tombol sekali lagi untuk keluar");
          }
        } else {
          setIsFullscreen(true);
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new CustomEvent("fullscreen-mode-change", { detail: { isFullscreen: true } }));
          showToastMsg("MODE LAYAR PENUH AKTIF");
        }
      }
    },
    [checkIsFullscreen, triggerHaptic, showToastMsg]
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

      {/* Broadcast Toast Notification */}
      {toast && (
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
        </div>
      )}
    </>
  );
};

export default FullscreenButton;
