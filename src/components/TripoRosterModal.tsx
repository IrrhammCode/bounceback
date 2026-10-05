import React, { useState } from 'react';
import { ROSTER_CYAN, ROSTER_CORAL, type FighterProfile } from '../game/config';

interface TripoRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRIPO_CHAR_PREVIEWS: Record<string, string> = {
  // Cyan Team
  cyan_player: '/models/characters/previews/char-1-king.webp',
  cyan_dj: '/models/characters/previews/char-2-dj.webp',
  cyan_ninja: '/models/characters/previews/char-3-ninja.webp',
  cyan_turbo: '/models/characters/previews/char-4-aviator.webp',
  cyan_popper: '/models/characters/previews/char-5-party.webp',
  // Coral Team
  coral_rex: '/models/characters/previews/char-6-dino.webp',
  coral_hopper: '/models/characters/previews/char-7-bunny.webp',
  coral_shady: '/models/characters/previews/char-8-agent.webp',
  coral_spike: '/models/characters/previews/char-9-viking.webp',
  coral_cyber: '/models/characters/previews/char-10-robot.webp',
};

const TRIPO_MODELS: Record<string, string> = {
  cyan_player: '/models/characters/char-1-king.glb',
  cyan_dj: '/models/characters/char-2-dj.glb',
  cyan_ninja: '/models/characters/char-3-ninja.glb',
  cyan_turbo: '/models/characters/char-4-aviator.glb',
  cyan_popper: '/models/characters/char-5-party.glb',
  coral_rex: '/models/characters/char-6-dino.glb',
  coral_hopper: '/models/characters/char-7-bunny.glb',
  coral_shady: '/models/characters/char-8-agent.glb',
  coral_spike: '/models/characters/char-9-viking.glb',
  coral_cyber: '/models/characters/char-10-robot.glb',
};

const TRIPO_TAGS: Record<string, string> = {
  cyan_player: 'Crown King',
  cyan_dj: 'Neon DJ',
  cyan_ninja: 'Ninja Cat',
  cyan_turbo: 'Turbo Aviator',
  cyan_popper: 'Party Popper',
  coral_rex: 'Dino Kaiju',
  coral_hopper: 'Bunny Brawler',
  coral_shady: 'Cyber Agent',
  coral_spike: 'Viking Bruiser',
  coral_cyber: 'Mecha Robot',
};

function StatBar({ label, value, max = 5, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-slate-300 font-bold">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm transition-all ${
              i < value ? color : 'bg-slate-700/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function TripoRosterModal({ isOpen, onClose }: TripoRosterModalProps) {
  const [selectedFighter, setSelectedFighter] = useState<FighterProfile | null>(ROSTER_CYAN[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-black tracking-widest text-amber-950 uppercase bg-amber-400 rounded-full flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Selected Fighter Hero Spotlight (if any) */}
        {selectedFighter && (
          <div className="bg-slate-800/90 border border-amber-400/30 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-xl">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-700/80 to-slate-900 border-2 border-amber-400/50 shadow-inner flex items-center justify-center flex-shrink-0">
              <img
                src={TRIPO_CHAR_PREVIEWS[selectedFighter.id]}
                alt={selectedFighter.name}
                className="w-full h-full object-contain filter drop-shadow-lg"
              />
              <span className="absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 uppercase tracking-wider">
                TRIPO 3D
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedFighter.team === 0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {selectedFighter.team === 0 ? 'Team Cyan' : 'Team Coral'} • #{selectedFighter.number}
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {TRIPO_TAGS[selectedFighter.id] || 'Fighter'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{selectedFighter.name}</h3>
              <p className="text-xs text-slate-300 italic mt-1 max-w-xl">"{selectedFighter.quote}"</p>
              <div className="mt-3 flex items-center justify-center md:justify-start gap-4">
                <div className="w-32">
                  <StatBar
                    label="PUNCH"
                    value={selectedFighter.statPunch}
                    color={selectedFighter.team === 0 ? 'bg-cyan-400' : 'bg-rose-400'}
                  />
                </div>
                <div className="w-32">
                  <StatBar
                    label="SPEED"
                    value={selectedFighter.statSpeed}
                    color={selectedFighter.team === 0 ? 'bg-cyan-400' : 'bg-rose-400'}
                  />
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 hidden md:block">
              <span className="text-[10px] font-mono text-slate-400 block">ASSET GLB</span>
              <span className="text-xs font-mono font-bold text-amber-300">{TRIPO_MODELS[selectedFighter.id]}</span>
            </div>
          </div>
        )}

        {/* 10 Fighters Grid */}
        <div className="space-y-6">
          {/* Team Cyan */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-black tracking-wider text-cyan-400 uppercase">
                Team Cyan // North Deck Heroes (5)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ROSTER_CYAN.map((f) => {
                const isSelected = selectedFighter?.id === f.id;
                const previewImg = TRIPO_CHAR_PREVIEWS[f.id];
                const tag = TRIPO_TAGS[f.id] || 'Hero';
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFighter(f)}
                    className={`flex flex-col bg-slate-800/80 border rounded-2xl p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md ${
                      isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-slate-800' : 'border-cyan-500/30 hover:border-cyan-400/80'
                    }`}
                  >
                    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-900/80 border border-slate-700/50 mb-2.5 flex items-center justify-center group">
                      <img
                        src={previewImg}
                        alt={f.name}
                        className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                        #{f.number}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-amber-400 tracking-tighter">
                        3D
                      </span>
                    </div>

                    <span className="text-xs font-black text-white leading-tight truncate">{f.name}</span>
                    <span className="text-[10px] font-bold text-cyan-400 mb-2">{tag}</span>

                    <div className="pt-2 border-t border-slate-700/50 space-y-1">
                      <StatBar label="PUNCH" value={f.statPunch} color="bg-cyan-400" />
                      <StatBar label="SPEED" value={f.statSpeed} color="bg-cyan-400" />
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
              <h3 className="text-sm font-black tracking-wider text-rose-400 uppercase">
                Team Coral // South Deck Bruisers (5)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ROSTER_CORAL.map((f) => {
                const isSelected = selectedFighter?.id === f.id;
                const previewImg = TRIPO_CHAR_PREVIEWS[f.id];
                const tag = TRIPO_TAGS[f.id] || 'Bruiser';
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFighter(f)}
                    className={`flex flex-col bg-slate-800/80 border rounded-2xl p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md ${
                      isSelected ? 'border-rose-400 ring-2 ring-rose-400/40 bg-slate-800' : 'border-rose-500/30 hover:border-rose-400/80'
                    }`}
                  >
                    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-900/80 border border-slate-700/50 mb-2.5 flex items-center justify-center group">
                      <img
                        src={previewImg}
                        alt={f.name}
                        className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                        #{f.number}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-amber-400 tracking-tighter">
                        3D
                      </span>
                    </div>

                    <span className="text-xs font-black text-white leading-tight truncate">{f.name}</span>
                    <span className="text-[10px] font-bold text-rose-400 mb-2">{tag}</span>

                    <div className="pt-2 border-t border-slate-700/50 space-y-1">
                      <StatBar label="PUNCH" value={f.statPunch} color="bg-rose-400" />
                      <StatBar label="SPEED" value={f.statSpeed} color="bg-rose-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Generated with <strong>Tripo 3D AI P1-20260311</strong> &bull; Low-Poly Meshopt + WebP 512</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black tracking-wide transition-all shadow-lg hover:shadow-amber-400/20"
          >
            BACK TO BATTLE
          </button>
        </div>
      </div>
    </div>
  );
}
