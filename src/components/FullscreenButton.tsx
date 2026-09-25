import React, { useState, useEffect, useCallback } from "react";

interface FullscreenButtonProps {
  className?: string;
  showLabel?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  className = "",
  showLabel = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateFsState = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    updateFsState();
    document.addEventListener("fullscreenchange", updateFsState);
    document.addEventListener("webkitfullscreenchange", updateFsState);
    document.addEventListener("mozfullscreenchange", updateFsState);
    document.addEventListener("MSFullscreenChange", updateFsState);

    return () => {
      document.removeEventListener("fullscreenchange", updateFsState);
      document.removeEventListener("webkitfullscreenchange", updateFsState);
      document.removeEventListener("mozfullscreenchange", updateFsState);
      document.removeEventListener("MSFullscreenChange", updateFsState);
    };
  }, []);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const doc = document as any;
    const docEl = document.documentElement as any;

    try {
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFs) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
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
      console.warn("Fullscreen toggle rejected:", err);
    }
  }, []);

  return (
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
  );
};

export default FullscreenButton;
