You are a senior game director + UI/UX + art director. Design the complete player-facing FLOW and VISUALS for an existing phone-first Three.js jam game “Boi-Boian”. Core combat is already built; you redesign structure, screens, and staging so a judge opens the link and immediately understands a polished product. Research traditional Indonesian Boi-Boian / Boy-Boyan and Hompimpa first (cite 3–6 sources at the end). Then output one production-ready spec — no marketing fluff.

# 1. PRODUCT
Phone browser game (Three.js, touch). Session 4–8 minutes. Portrait AND landscape both supported; landscape preferred for play. English default, optional ID/EN toggle. Jam constraints: 3D in world = Three.js CODE modules only; 2D portraits/sky/SFX may be files; no text glyphs on 3D meshes; no trademarks.

One-liner: 5v5 yard chaos — knock a 12-shard terracotta pyramid with a soft ball; the team that knocked must rebuild it under fire; defenders tag with a ball they must PASS (cannot run while holding). Finish the stack and shout “Boi!”. Hompimpa picks the teams.

# 2. RULES THAT DO NOT CHANGE
- Court 16×16 m dirt; throw line 5 m; rebuild zone r=1.8 m; ball Ø0.18 m
- 12 shards, 4 courses (5+4+2+1), pyramid ~0.55 base × 0.45 tall
- Pass-not-run; max hold ~1.8 s then drop; max 2 kids carry shards; max 2 tag-side in zone
- Place channel ~0.35 s; course order required; full stack + short hold in zone = Boi
- Knock team rebuilds after collapse (traditional); knock team alternates each round
- Tag = out until round end; wipe if all rebuilders out; timer ~100 s with ≥8/12 closeness rule
- 10 skill kids: Sprinter, Thrower, Stacker, Spotter, Passer, Carrier, Trickster, Tank, Bait, Captain
- First-person default (eye ~1.12 m, FOV ~72), third-person toggle; virtual stick left, actions right

# 3. NEW REQUIRED FLOW (design this end-to-end)
Step 1 TITLE
- ONE primary CTA: “Play”. NO blue/yellow choice on title.
- Secondary: language ID/EN. Optional quiet “How to play” that does not block Play.
- Live 3D diorama behind UI (school gate + small tile pile + 1–2 idle kids). Flagpole must NOT cut through the logo.

Step 2 ROSTER INTRO (“Meet the kids”)
- All 10 characters: portrait, name, one-line skill verb.
- Teach skills without a wall of text. Portrait 390×844 and landscape 844×390 layouts.
- Recommend swipe/carousel vs grid; “Continue” when done; optional Skip after first visit.

Step 3 HOMPIMPA CEREMONY (zoom)
- Camera zooms into a tight circle of the 10 kids.
- Real choreography: HOM (hands low at chest) → PIM (hands rise) → PA (thrust hands, show palm UP or DOWN) → alaium (circle/bounce) → gambreng (freeze + hop).
- Chant typography pops per syllable; PA! is the hero beat.
- Timing in seconds per beat. Must read on a 6" phone.

Step 4 SPLIT
- After palms, split into two teams of 5 (theatrical palms; if not naturally 5/5, force 5v5 and say so).
- Kids walk to Team A (screen left) and Team B (screen right).

Step 5 ASSIGN KITS
- Reveal colours: e.g. Team A → Blue, Team B → Yellow (or random colour assignment — pick one rule and state it).
- Show team lists with portraits + skills briefly, then “Let’s play”.

Step 6 ROUND START
- Knock team throws at the standing pyramid from the throw line (player is on knock team if they chose that duty via quick play later, or after hompimpa they are assigned a team).
- On collapse: DUTY FLIP — knockers rebuild; other team tags with ball.
- Spec FP player verbs during throw, carry tile, place, get tagged.

Step 7 MATCH STRUCTURE (“5 ronde”)
- Define exact win: e.g. first to 3 round wins, max 5 rounds (best-of-5).
- Between rounds: 2s score card, who knocks next (alternate), then next round.
- End: winner, Rematch → Step 1 or Step 2 (choose one).

Step 8 CONTINUITY
- Skip intro after first match; never soft-lock if an anim fails; jam gate still needs tap-start + move ≥1 m.

# 4. VISUAL DESIGN (both orientations)
Style sentence (verbatim): Weathered Indonesian courtyard play props: cracked terracotta tile shards, dusty packed earth, rubber playground ball, and simple low-poly kid silhouettes with matte plastic-toy finish, lit by late-afternoon warm sun.

Palette (exact, do not invent):
#c4a574 earth_dust · #6e5338 earth_shadow · #b8956a path · #b85a3a tile_body · #8a3d28 tile_lip · #d4784c tile_glaze · #d9cfc0 plaster · #a9784f timber · #d94a3a ball · #3d6ea5 blue · #e8b84a yellow · #d4a574 skin · #2a221c hair · #fff1c9 accent_boi (UI only)

Design for EACH of: TITLE, ROSTER, HOMPIMPA, TEAM REVEAL, IN-MATCH FP HUD, ROUND END, MATCH END.
For every screen provide:
- Portrait 390×844 wireframe (ASCII) + landscape 844×390 wireframe
- Type scale, margins, safe-area, button sizes (≥44px)
- Thumb zones (left stick / right actions)
- Camera staging notes for live 3D (yaw, height, FOV, scrim gradient)
- Component kit: primary/secondary button, chip, portrait card, palm icon, score pill, toast
- Do / Don’t

# 5. IN-MATCH HUD (minimal, both orientations)
Score, duty chip, timer, 5+5 kid dots, n/12 progress, Swap / Pass / context action (Pick|Place|Throw), FP/3P toggle, pause. Must not fight rebuild ghosts or charge ring.

# 6. SUCCESS CRITERIA
- Primary “Play” obvious in one glance; no form-like stack of equal buttons
- New player states the pass rule after title + roster + one glance at HUD
- Hompimpa PA! is screenshot-worthy; palms readable
- Blue vs Yellow separate at 390px width
- Pyramid and ball are the densest high-contrast masses in play frames
- Ground takes light; frame edges darker than warm play pool
- Flagpole never crosses the wordmark

# 7. CUT LIST (1 day left)
Sacred vs cuttable across new flow + visuals.

# 8. OUTPUT FORMAT
1. Short research notes with [n] citations (max 6)
2. Flow diagram (mermaid or ASCII)
3. Per-screen specs (tables + ASCII wireframes portrait AND landscape)
4. Camera / staging specs
5. Copy deck EN + ID (≤12 words per line)
6. Open questions ≤5

No fluff. Production-ready numbers. Do not redesign knock/pass/rebuild combat rules — only structure, screens, and staging.