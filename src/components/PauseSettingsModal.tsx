import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAudioSettings,
  setMasterVolume,
  setBgmVolume,
  setSfxVolume,
  setMuted,
  isMuted,
} from "../game/audio";
import FullscreenButton from "./FullscreenButton";

interface PauseSettingsModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  onOpenOrientationGuide?: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onExitToTitle,
  onOpenOrientationGuide,
}) => {
  const [activeTab, setActiveTab] = useState<"settings" | "controls">("settings");
  const [masterVol, setMasterVolState] = useState(55);
  const [bgmVol, setBgmVolState] = useState(16);
  const [sfxVol, setSfxVolState] = useState(70);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getAudioSettings();
      setMasterVolState(Math.round(cfg.masterVolume * 100));
      setBgmVolState(Math.round(cfg.bgmVolume * 100));
      setSfxVolState(Math.round(cfg.sfxVolume * 100));
      setMutedState(cfg.muted);
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleMasterChange = (val: number) => {
    setMasterVolState(val);
    setMasterVolume(val / 100);
  };

  const handleBgmChange = (val: number) => {
    setBgmVolState(val);
    setBgmVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVolState(val);
    setSfxVolume(val / 100);
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  return createPortal(
    <div
      className="pause-modal-backdrop animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="pause-modal-card animate-scale-pop">
        {/* Header */}
        <div className="pause-modal-header">
          <div className="pause-header-badge">
            <span className="live-dot" />
            MATCH PAUSED
          </div>
          <button
            type="button"
            className="pause-close-btn"
            onClick={onResume}
            aria-label="Resume Game"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="pause-tab-bar">
          <button
            type="button"
            className={`pause-tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            AUDIO & DISPLAY
          </button>
          <button
            type="button"
            className={`pause-tab-btn ${activeTab === "controls" ? "active" : ""}`}
            onClick={() => setActiveTab("controls")}
          >
            CONTROLS GUIDE
          </button>
        </div>

        {/* Tab 1: Settings */}
        {activeTab === "settings" && (
          <div className="pause-tab-body">
            {/* Master Volume */}
            <div className="pause-setting-row">
              <div className="setting-label-wrap">
                <span className="setting-title">Master Audio</span>
                <span className="setting-val">{muted ? "MUTED" : `${masterVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : masterVol}
                disabled={muted}
                onChange={(e) => handleMasterChange(Number(e.target.value))}
                className="pause-slider"
              />
            </div>

            {/* BGM Volume */}
            <div className="pause-setting-row">
              <div className="setting-label-wrap">
                <span className="setting-title">Music (BGM)</span>
                <span className="setting-val">{muted ? "MUTED" : `${bgmVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : bgmVol}
                disabled={muted}
                onChange={(e) => handleBgmChange(Number(e.target.value))}
                className="pause-slider cyan"
              />
            </div>

            {/* SFX Volume */}
            <div className="pause-setting-row">
              <div className="setting-label-wrap">
                <span className="setting-title">Sound Effects (SFX)</span>
                <span className="setting-val">{muted ? "MUTED" : `${sfxVol}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : sfxVol}
                disabled={muted}
                onChange={(e) => handleSfxChange(Number(e.target.value))}
                className="pause-slider coral"
              />
            </div>

            {/* Mute Toggle Button */}
            <div className="pause-quick-actions">
              <button
                type="button"
                className={`pause-toggle-btn ${muted ? "active" : ""}`}
                onClick={toggleMute}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {muted ? (
                    <>
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </>
                  ) : (
                    <>
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </>
                  )}
                </svg>
                {muted ? "UNMUTE AUDIO" : "MUTE ALL AUDIO"}
              </button>

              {onOpenOrientationGuide && (
                <button
                  type="button"
                  className="pause-toggle-btn guide"
                  onClick={onOpenOrientationGuide}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  ROTATE / FULLSCREEN GUIDE
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Controls */}
        {activeTab === "controls" && (
          <div className="pause-tab-body">
            <div className="controls-cheat-grid">
              <div className="cheat-col">
                <div className="cheat-subheading">TOUCH CONTROLS (MOBILE)</div>
                <div className="cheat-item">
                  <span className="cheat-key">Analog Stick</span>
                  <span className="cheat-desc">Move & Steer in 360°</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key red">Punch</span>
                  <span className="cheat-desc">Knockback slap & dislodge opponents</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key cyan">Dash</span>
                  <span className="cheat-desc">Rapid burst surge into action</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key gold">Skill</span>
                  <span className="cheat-desc">Trigger stadium mystery item</span>
                </div>
              </div>

              <div className="cheat-col">
                <div className="cheat-subheading">KEYBOARD (PC / MAC)</div>
                <div className="cheat-item">
                  <span className="cheat-key">W / A / S / D</span>
                  <span className="cheat-desc">Movement controls</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key">Spacebar</span>
                  <span className="cheat-desc">Punch Slap</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key">Shift</span>
                  <span className="cheat-desc">Speed Dash</span>
                </div>
                <div className="cheat-item">
                  <span className="cheat-key">E / Q</span>
                  <span className="cheat-desc">Use Special Skill</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pause-actions-footer">
          <button
            type="button"
            className="pause-action-btn primary"
            onClick={onResume}
          >
            RESUME MATCH
          </button>
          <button
            type="button"
            className="pause-action-btn warning"
            onClick={onRestart}
          >
            RESTART ROUND
          </button>
          <button
            type="button"
            className="pause-action-btn danger"
            onClick={onExitToTitle}
          >
            EXIT TO TITLE
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PauseSettingsModal;
