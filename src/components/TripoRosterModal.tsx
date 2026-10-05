import React from 'react';
import { ROSTER_CYAN, ROSTER_CORAL } from '../game/config';

interface TripoRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRIPO_CHAR_PREVIEWS: Record<string, string> = {
  // Cyan Team
  cyan_player: '/models/characters/char-1-king.glb',
  cyan_dj: '/models/characters/char-2-dj.glb',
  cyan_ninja: '/models/characters/char-3-ninja.glb',
  cyan_turbo: '/models/characters/char-4-aviator.glb',
  cyan_popper: '/models/characters/char-5-party.glb',
  // Coral Team
  coral_rex: '/models/characters/char-6-dino.glb',
  coral_hopper: '/models/characters/char-7-bunny.glb',
  coral_shady: '/models/characters/char-8-agent.glb',
  coral_spike: '/models/characters/char-9-viking.glb',
  coral_cyber: '/models/characters/char-10-robot.glb',
};

const TRIPO_LABELS: Record<string, { icon: string; tag: string }> = {
  cyan_player: { icon: '👑', tag: 'Crown King' },
  cyan_dj: { icon: '🎧', tag: 'Neon DJ' },
  cyan_ninja: { icon: '🐱', tag: 'Ninja Cat' },
  cyan_turbo: { icon: '✈️', tag: 'Turbo Aviator' },
  cyan_popper: { icon: '🎉', tag: 'Party Popper' },
  coral_rex: { icon: '🦖', tag: 'Dino Kaiju' },
  coral_hopper: { icon: '🐰', tag: 'Bunny Brawler' },
  coral_shady: { icon: '🕶️', tag: 'Cyber Agent' },
  coral_spike: { icon: '⚔️', tag: 'Viking Bruiser' },
  coral_cyber: { icon: '🤖', tag: 'Mecha Robot' },
};

export default function TripoRosterModal({ isOpen, onClose }: TripoRosterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-black tracking-widest text-amber-950 uppercase bg-amber-400 rounded-full">
                TRIPO 3D AI GENERATED
              </span>
              <span className="text-xs font-bold text-cyan-400">10 BATTLE FIGHTERS</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-wide">
              5v5 HERO ROSTER SHOWCASE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Team Cyan */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-lg font-black tracking-wider text-cyan-400 uppercase">
                Team Cyan // North Deck Heroes (5)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ROSTER_CYAN.map((f, idx) => {
                const info = TRIPO_LABELS[f.id] || { icon: '⭐', tag: 'Hero' };
                return (
                  <div
                    key={f.id}
                    className="flex flex-col bg-slate-800/80 border border-cyan-500/30 rounded-2xl p-3.5 hover:border-cyan-400 transition-all hover:-translate-y-1 shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                        #{f.number}
                      </span>
                    </div>
                    <span className="text-sm font-black text-white leading-tight">{f.name}</span>
                    <span className="text-[11px] font-bold text-cyan-400 mb-2">{info.tag}</span>
                    <p className="text-[10px] text-slate-400 italic flex-1 mb-2">"{f.quote}"</p>
                    <div className="pt-2 border-t border-slate-700/50 flex justify-between text-[10px] font-mono text-slate-300">
                      <span>PUNCH: {f.statPunch}★</span>
                      <span>SPD: {f.statSpeed}★</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Coral */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-lg font-black tracking-wider text-rose-400 uppercase">
                Team Coral // South Deck Bruisers (5)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ROSTER_CORAL.map((f, idx) => {
                const info = TRIPO_LABELS[f.id] || { icon: '🔥', tag: 'Bruiser' };
                return (
                  <div
                    key={f.id}
                    className="flex flex-col bg-slate-800/80 border border-rose-500/30 rounded-2xl p-3.5 hover:border-rose-400 transition-all hover:-translate-y-1 shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                        #{f.number}
                      </span>
                    </div>
                    <span className="text-sm font-black text-white leading-tight">{f.name}</span>
                    <span className="text-[11px] font-bold text-rose-400 mb-2">{info.tag}</span>
                    <p className="text-[10px] text-slate-400 italic flex-1 mb-2">"{f.quote}"</p>
                    <div className="pt-2 border-t border-slate-700/50 flex justify-between text-[10px] font-mono text-slate-300">
                      <span>PUNCH: {f.statPunch}★</span>
                      <span>SPD: {f.statSpeed}★</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>✨ Generated with <strong>Tripo 3D AI P1-20260311</strong> &bull; Meshopt + WebP 512</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black tracking-wide transition-all shadow-lg"
          >
            BACK TO BATTLE
          </button>
        </div>
      </div>
    </div>
  );
}
