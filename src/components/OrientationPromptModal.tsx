import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface OrientationPromptModalProps {
  forceShowTutorial?: boolean;
  onCloseTutorial?: () => void;
  inGame?: boolean;
}

export type GuideTopic = "rotate" | "fullscreen";

export const OrientationPromptModal: React.FC<OrientationPromptModalProps> = ({
  forceShowTutorial = false,
  onCloseTutorial,
  inGame = false,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<"iphone" | "android">("iphone");
  const [activeTopic, setActiveTopic] = useState<GuideTopic>("rotate");
  const [fullscreenActive, setFullscreenActive] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 18;
    setCanScrollDown(hasMore);
  }, []);

  const handleScrollDown = () => {
    cardRef.current?.scrollBy({ top: 160, behavior: "smooth" });
  };

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

  // Listen to global open events from Title Screen, Pause Menu, or Fullscreen button
  useEffect(() => {
    const handleOpenTutorial = (e: any) => {
      if (e?.detail?.topic === "rotate" || e?.detail?.topic === "fullscreen") {
        setActiveTopic(e.detail.topic);
      }
      setShowTutorial(true);
    };
    window.addEventListener("open-orientation-guide", handleOpenTutorial);
    window.addEventListener("open-phone-tips", handleOpenTutorial);
    window.addEventListener("open-ios-fs-modal", (e: any) => {
      setActiveTopic("fullscreen");
      handleOpenTutorial(e);
    });
    return () => {
      window.removeEventListener("open-orientation-guide", handleOpenTutorial);
      window.removeEventListener("open-phone-tips", handleOpenTutorial);
      window.removeEventListener("open-ios-fs-modal", handleOpenTutorial);
    };
  }, []);

  useEffect(() => {
    if (forceShowTutorial) {
      setShowTutorial(true);
    }
  }, [forceShowTutorial]);

  useEffect(() => {
    if (showTutorial) {
      const timer = setTimeout(checkScrollState, 80);
      window.addEventListener("resize", checkScrollState);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkScrollState);
      };
    }
  }, [showTutorial, activeDeviceTab, activeTopic, checkScrollState]);

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

  // Quick toggle fullscreen from inside the modal
  const handleToggleFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
        setFullscreenActive(false);
      } else {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          root.requestFullscreen().catch(() => {});
          setFullscreenActive(true);
        } else if ((root as any).webkitRequestFullscreen) {
          (root as any).webkitRequestFullscreen();
          setFullscreenActive(true);
        }
      }
    } catch {}
    document.body.classList.toggle("simulated-fullscreen");
    window.dispatchEvent(new CustomEvent("fullscreen-mode-change"));
  };

  if (typeof document === "undefined") return null;

  // Show Tutorial Modal if requested
  if (showTutorial) {
    return createPortal(
      <div
        className="orientation-tutorial-backdrop animate-fade-in"
        onClick={handleCloseTutorial}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={cardRef}
          onScroll={checkScrollState}
          className="orientation-tutorial-card animate-scale-pop"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="tutorial-header">
            <div className="tutorial-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>PHONE &amp; TABLET GUIDE</span>
            </div>
            <button
              type="button"
              className="tutorial-close-btn"
              onClick={handleCloseTutorial}
              aria-label="Close Guide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Title & Short Description */}
          <div className="tutorial-title">Rotate &amp; Fullscreen Guide</div>
          <p className="tutorial-desc">
            Optimize your mobile display for the full 5v5 stadium experience.
          </p>

          {/* Topic Switcher (2 Clean Balanced Tabs) */}
          <div className="guide-topic-bar">
            <button
              type="button"
              className={`guide-topic-btn ${activeTopic === "rotate" ? "active" : ""}`}
              onClick={() => setActiveTopic("rotate")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>1. Rotate Screen</span>
            </button>
            <button
              type="button"
              className={`guide-topic-btn ${activeTopic === "fullscreen" ? "active" : ""}`}
              onClick={() => setActiveTopic("fullscreen")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>2. 100% Fullscreen</span>
            </button>
          </div>

          {/* Device Switcher (Single-Line Clean Segmented Pill) */}
          <div className="guide-device-bar">
            <button
              type="button"
              className={`guide-device-btn ${activeDeviceTab === "iphone" ? "active" : ""}`}
              onClick={() => setActiveDeviceTab("iphone")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>Apple iPhone</span>
            </button>
            <button
              type="button"
              className={`guide-device-btn ${activeDeviceTab === "android" ? "active" : ""}`}
              onClick={() => setActiveDeviceTab("android")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <circle cx="12" cy="18" r="1" />
              </svg>
              <span>Android Phone</span>
            </button>
          </div>

          {/* ==================== CONTENT 1: ROTATE SCREEN ==================== */}
          {activeTopic === "rotate" && (
            <div className="tutorial-steps-wrap">
              {activeDeviceTab === "iphone" ? (
                <>
                  <div className="tutorial-step">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <div className="step-name">Open Control Center</div>
                      <div className="step-info">
                        Swipe down from the <strong>top-right corner</strong> of your screen.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <div className="step-name">Turn OFF Portrait Lock</div>
                      <div className="step-info">
                        Tap the <strong>Lock with Circular Arrow</strong> icon so it becomes <strong>gray (OFF)</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <div className="step-name">Turn Phone Sideways</div>
                      <div className="step-info">
                        Rotate iPhone horizontally. The match instantly expands into full widescreen view!
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="guide-switch-link"
                    onClick={() => setActiveTopic("fullscreen")}
                  >
                    <span>Need borderless fullscreen? View Fullscreen Guide</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <div className="tutorial-step">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <div className="step-name">Open Quick Settings</div>
                      <div className="step-info">
                        Swipe down twice from the top of your screen to reveal toggles.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <div className="step-name">Enable "Auto-Rotate"</div>
                      <div className="step-info">
                        Tap the <strong>Auto-rotate</strong> tile so it shows <strong>Auto-rotate (ON)</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <div className="step-name">Turn Phone Sideways</div>
                      <div className="step-info">
                        Rotate horizontally. The arena automatically expands across your widescreen!
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="guide-switch-link"
                    onClick={() => setActiveTopic("fullscreen")}
                  >
                    <span>Need borderless fullscreen? View Fullscreen Guide</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ==================== CONTENT 2: 100% FULLSCREEN ==================== */}
          {activeTopic === "fullscreen" && (
            <div className="tutorial-steps-wrap">
              {activeDeviceTab === "iphone" ? (
                <>
                  <div className="tutorial-step">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <div className="step-name">Tap Safari Share Button</div>
                      <div className="step-info">
                        Tap the square share icon (arrow pointing up) at the bottom of Safari.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <div className="step-name">Select "Add to Home Screen"</div>
                      <div className="step-info">
                        Scroll down the menu and tap <strong>Add to Home Screen</strong>, then tap <em>Add</em>.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <div className="step-name">Launch from Home Screen</div>
                      <div className="step-info">
                        Open the icon on your Home Screen. It runs in <strong>100% borderless fullscreen with zero address bars</strong>!
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-tip-box">
                    <div className="tip-title">QUICK SAFARI SHORTCUT</div>
                    <div className="tip-content">
                      In Safari, tap the <strong>aA</strong> button on the left of your address bar &rarr; select <em>"Hide Toolbar"</em> for instant room.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="tutorial-step">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <div className="step-name">Tap Chrome Menu</div>
                      <div className="step-info">
                        Tap the three vertical dots (<strong>&vellip;</strong>) in the top-right corner of Google Chrome.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <div className="step-name">Select "Add to Home screen"</div>
                      <div className="step-info">
                        Tap <strong>Add to Home screen</strong> (or <strong>Install app</strong>) and confirm.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-step">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <div className="step-name">Launch from Home Screen</div>
                      <div className="step-info">
                        Open from your app drawer to play in pure fullscreen with zero browser address bars.
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-tip-box">
                    <div className="tip-title">INSTANT FULLSCREEN SHORTCUT</div>
                    <div className="tip-content">
                      You can also tap the <strong>Fullscreen Button</strong> below to enter browser immersive mode immediately!
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Scroll Indicator Hint Pill (shown when content is taller than viewport) */}
          {canScrollDown && (
            <button
              type="button"
              className="tutorial-scroller-hint animate-bounce-subtle"
              onClick={handleScrollDown}
              aria-label="Scroll down for more steps"
            >
              <span>SCROLL DOWN FOR MORE</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          {/* Footer Actions (Stacked Vertically for Perfect Mobile Responsiveness) */}
          <div className="tutorial-footer">
            <button
              type="button"
              className="tutorial-btn primary"
              onClick={handleCloseTutorial}
            >
              GOT IT, LET'S PLAY!
            </button>

            <button
              type="button"
              className="tutorial-btn secondary"
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen Mode"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>{fullscreenActive ? "EXIT FULLSCREEN" : "TOGGLE FULLSCREEN NOW"}</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Floating Notification Banner on Mobile Portrait (never show during active match gameplay)
  if (!isMobileDevice || !isPortrait || dismissed || inGame) return null;

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
          onClick={() => {
            setActiveTopic("rotate");
            setShowTutorial(true);
          }}
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
