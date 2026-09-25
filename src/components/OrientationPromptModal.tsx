import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface OrientationPromptModalProps {
  forceShowTutorial?: boolean;
  onCloseTutorial?: () => void;
}

export const OrientationPromptModal: React.FC<OrientationPromptModalProps> = ({
  forceShowTutorial = false,
  onCloseTutorial,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<"iphone" | "android">("iphone");

  const checkOrientation = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const portrait = h > w;
    setIsPortrait(portrait);

    const ua = navigator.userAgent || "";
    const isTouch =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      "ontouchstart" in window ||
      ((navigator.maxTouchPoints || 0) > 0 && Math.min(w, h) <= 1024);

    setIsMobileDevice(isTouch);

    // Auto-detect default device tab
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setActiveDeviceTab("iphone");
    } else if (/Android/i.test(ua)) {
      setActiveDeviceTab("android");
    }
  }, []);

  useEffect(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", checkOrientation);
    }
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", checkOrientation);
      }
    };
  }, [checkOrientation]);

  useEffect(() => {
    if (forceShowTutorial) {
      setShowTutorial(true);
    }
  }, [forceShowTutorial]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    if (onCloseTutorial) onCloseTutorial();
  };

  const handleDismissPrompt = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("bb_portrait_dismissed", "1");
    } catch {}
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem("bb_portrait_dismissed") === "1") {
        setDismissed(true);
      }
    } catch {}
  }, []);

  if (typeof document === "undefined") return null;

  // Show Tutorial Modal if explicitly requested
  if (showTutorial) {
    return createPortal(
      <div
        className="orientation-tutorial-backdrop animate-fade-in"
        onClick={handleCloseTutorial}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="orientation-tutorial-card animate-scale-pop"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="tutorial-header">
            <div className="tutorial-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              LANDSCAPE & FULLSCREEN SETUP GUIDE
            </div>
            <button
              type="button"
              className="tutorial-close-btn"
              onClick={handleCloseTutorial}
              aria-label="Close Guide"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="tutorial-title">Rotate Phone for Maximum Arena Field of View!</div>
          <p className="tutorial-desc">
            BounceBack features an ultra-wide 5v5 stadium. Playing in <strong>Landscape</strong> gives you the full panoramic tactical vision of all 10 players and hazard traps.
          </p>

          {/* Device Tabs */}
          <div className="device-tab-bar">
            <button
              type="button"
              className={`device-tab-btn ${activeDeviceTab === "iphone" ? "active" : ""}`}
              onClick={() => setActiveDeviceTab("iphone")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              Apple iPhone (iOS)
            </button>
            <button
              type="button"
              className={`device-tab-btn ${activeDeviceTab === "android" ? "active" : ""}`}
              onClick={() => setActiveDeviceTab("android")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <circle cx="12" cy="18" r="1" />
              </svg>
              Android (Samsung / Pixel / Xiaomi)
            </button>
          </div>

          {/* Tab 1: iPhone */}
          {activeDeviceTab === "iphone" && (
            <div className="tutorial-steps-wrap">
              <div className="tutorial-step">
                <div className="step-num">1</div>
                <div className="step-body">
                  <div className="step-name">Open Control Center</div>
                  <div className="step-info">
                    Swipe down from the <strong>top-right corner</strong> of your screen (or swipe up from the bottom on older iPhone models).
                  </div>
                </div>
              </div>

              <div className="tutorial-step">
                <div className="step-num">2</div>
                <div className="step-body">
                  <div className="step-name">Turn OFF Portrait Lock</div>
                  <div className="step-info">
                    Tap the <strong>Lock with Circular Arrow</strong> icon. Ensure it is <strong>white/gray (OFF)</strong>, not red/active.
                  </div>
                </div>
              </div>

              <div className="tutorial-step">
                <div className="step-num">3</div>
                <div className="step-body">
                  <div className="step-name">Rotate Phone to Landscape</div>
                  <div className="step-info">
                    Turn your iPhone sideways. The game will automatically reconfigure into full widescreen mode!
                  </div>
                </div>
              </div>

              <div className="tutorial-tip-box">
                <div className="tip-title">PRO TIP: 100% Fullscreen in Safari</div>
                <div className="tip-content">
                  Tap Safari's <strong>Share</strong> button &rarr; <strong>Add to Home Screen</strong>. Opening from home screen removes all browser address bars completely!
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Android */}
          {activeDeviceTab === "android" && (
            <div className="tutorial-steps-wrap">
              <div className="tutorial-step">
                <div className="step-num">1</div>
                <div className="step-body">
                  <div className="step-name">Open Quick Settings</div>
                  <div className="step-info">
                    Swipe down twice from the top of your screen to expand the quick settings panel.
                  </div>
                </div>
              </div>

              <div className="tutorial-step">
                <div className="step-num">2</div>
                <div className="step-body">
                  <div className="step-name">Enable "Auto-Rotate"</div>
                  <div className="step-info">
                    Find the <strong>Auto-rotate</strong> tile (or <strong>Portrait</strong> tile) and tap it so it says <strong>Auto-rotate (ON)</strong>.
                  </div>
                </div>
              </div>

              <div className="tutorial-step">
                <div className="step-num">3</div>
                <div className="step-body">
                  <div className="step-name">Turn Phone Sideways</div>
                  <div className="step-info">
                    Rotate your device horizontally. The game expands to fill the entire wide display!
                  </div>
                </div>
              </div>

              <div className="tutorial-tip-box">
                <div className="tip-title">PRO TIP: Fullscreen in Chrome</div>
                <div className="tip-content">
                  In Chrome, tap the three dots (`⋮`) &rarr; <strong>Add to Home screen</strong> or <strong>Install app</strong> for borderless full-screen gaming.
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="tutorial-footer">
            <button
              type="button"
              className="tutorial-btn primary"
              onClick={handleCloseTutorial}
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Floating Notification Banner on Mobile Portrait
  if (!isMobileDevice || !isPortrait || dismissed) return null;

  return createPortal(
    <div className="portrait-suggest-banner animate-fade-in" role="alert">
      <div className="suggest-icon-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M12 12h.01" />
          <path d="M17 2l4 4-4 4" />
          <path d="M7 22l-4-4 4-4" />
        </svg>
      </div>
      <div className="suggest-text-wrap">
        <div className="suggest-title">ROTATE TO LANDSCAPE RECOMMENDED</div>
        <div className="suggest-sub">Play horizontally for the best 5v5 esports stadium experience!</div>
      </div>
      <div className="suggest-btn-wrap">
        <button
          type="button"
          className="suggest-guide-btn"
          onClick={() => setShowTutorial(true)}
        >
          HOW TO ROTATE
        </button>
        <button
          type="button"
          className="suggest-dismiss-btn"
          onClick={handleDismissPrompt}
          aria-label="Dismiss and play in portrait"
        >
          DISMISS
        </button>
      </div>
    </div>,
    document.body
  );
};

export default OrientationPromptModal;
