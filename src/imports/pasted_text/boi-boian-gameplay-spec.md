You are a senior gameplay director + systems designer + UX designer + combat feel designer. Design the COMPLETE in-match gameplay of the existing phone Three.js game “Boi-Boian” — from knock throw through rebuild under fire to Boi. Hompimpa ceremony and title are DONE; do not redesign them. Research traditional Indonesian Boi-Boian / Boy-Boyan first (cite 4–8 sources). Output one production-ready spec an engineer can implement without guessing.

# PRODUCT
Phone browser, touch, landscape preferred + portrait, English default. Session 4–8 min. FP default (eye ~1.12 m, FOV ~72), 3P toggle. 5v5 low-poly toy kids in a late-afternoon Indonesian school dirt courtyard.

# RULES (locked — do not invent new win conditions)
- Court 16×16 m; throw line 5 m toward −Z; rebuild zone r=1.8 m at origin
- Ball Ø0.18 m; 12 terracotta shards; pyramid courses 5+4+2+1 (~0.55 base × 0.45 tall)
- Knock team throws from behind throw line; up to 3 team throws; pity auto-collapse after 3 misses
- On collapse: DUTY FLIP — knockers rebuild; other team tags with ball
- Pass-not-run: holder rooted; max hold ~1.8 s then drop; pass chain optional juice
- Max 2 kids carry shards; max 2 tag-side inside rebuild zone
- Pick radius ~0.35 m; place channel ~0.35 s; cancel if tagged or leave zone
- Course order required; full 12 + brief hold in zone (or explicit Boi) = round win
- Tag = out until round end; wipe if all rebuilders out; timer ~100 s; ≥8/12 closeness rule
- Best-of-5 rounds (first to 3); knock team alternates next round
- 10 skill kids (Sprinter…Captain) with stat mods; body-swap among living teammates

# CORE VERBS TO DESIGN IN DEPTH

## A. THROW BALL (knock + tag)
1. Knock throw (Phase B)
   - FP: hold Action to charge, release to throw toward look / pyramid
   - Charge 0.15–0.7 s → speed/arc; aim assist ≤15° under 4 m, never lock-on always-hit
   - Ball flight physics feel (gravity per state), trail, impact on stack
   - Miss: ball returns or goes loose; 3 misses → pity collapse + toast
2. Tag throw (Phase C, ball team)
   - Same charge; hit radius ~0.28 m on rebuilder body
   - Lead / soft assist; near-miss whoosh juice
   - AI thrower: wind-up pose, randomized delay, aim error by distance
3. Pass (signature)
   - No run while holding; Oper to nearest or tap-target teammate
   - Intercept possible; pass chain 1–3 boosts next throw slightly
   - Pump-fake: release charge <0.15 s, ball stays, short arm fake

## B. HANCUR / KNOCK THE TILES (destroy pyramid)
1. Readability: pyramid is the densest terracotta mass; courses readable from phone
2. Hit detection: ball vs stack (AABB/sphere); collapse animation
3. Collapse juice: shards scatter within ~1.2 m, dust burst, shock ring, hit-stop 0.1s, camera punch, collapse SFX
4. Pity scatter after 3 failed knocks (soft, no style bonus)
5. After collapse: ball loose; duty flip toast; knock team runs to rebuild

## C. BUILD / REBUILD THE TILES (THIS IS THE FLAGSHIP NEW UX)
User requirement: there is a BUILD button; when building, camera ZOOM LOCKS (commit view). If a ball approaches the player while building, show a DANGER WARNING; bots that build auto-dodge.

Design all of this:

### C1. Build entry
- Context: holding a shard, inside rebuild zone (or approaching)
- Dedicated **BUILD** button (not only “Place”) — big, thumb-reachable
- On press: enter **Build Mode** (locked)

### C2. Build Mode — zoom lock
- Camera: push in / lock on the stack slot (not free look)
  - Suggest: dolly to ~1.2–1.8 m from next slot, slight high 3/4, FOV ~55–65
  - Slot ghost pulse; next valid course highlighted
  - Player still can cancel (back / swipe out / get tagged)
- Progress: 0.35 s channel with visible fill (bar or ring under ghost)
- Success: snap settle + dust + click; auto-target next slot if still holding? (recommend: release carry, need new pick — keep max 2 carriers)
- Invalid slot: reject nudge + shake ghost (never silent)

### C3. Slot targeting in Build Mode
- Auto-select next valid slot by course order (base first)
- Optional left/right nudge between free slots on same course
- FP still sees hands/tile ghost; 3P sees body kneel

### C4. DANGER WARNING (ball approaching while building)
When local player is in Build Mode / place channel AND ball is in flight or carrier within X m:
- Screen edge vignette pulse (team colour of thrower or red-cream)
- Icon + short text: e.g. “!” or “BALL!” (EN/ID)
- Optional haptic vibrate
- Optional slow-mo 0.15 s on incoming tag throw (tasteful, not every frame)
- Channel: if tagged mid-channel → cancel, kid out, shard drops
- If player cancels in time (release BUILD / move out) → no tag, small “close” juice

Spec exact distances: warn at ≤3.5 m throw path, critical at ≤1.5 m.

### C5. BOT rebuild behaviour
- Stacker AI picks shard → carries → **auto-enters Build Mode equivalent** (same 0.35 s place)
- **Auto-dodge**: if ball threat (carrier ≤3.8 m or throw path near) while carrying or placing:
  - Abort place, lateral juke 1.5–2 m, then resume
  - Visible: brief dodge anim + no danger UI spam on AI (player danger UI only for local player)
- Max 2 AI carriers; 3rd waits / baits
- Never all 5 stack on one shard

### C6. Build feedback package
- Ghost slot, progress ring, settle bounce, sparks, SFX pick/place/reject
- Progress n/12 in HUD updates
- At 10/12: heartbeat / “Almost Boi” cue (subtle)

## D. TAG / OUT / LAST STAND
- Sit-out pose; kid dots update
- Last stand: 1 rebuilder left → +10% speed, tag hold tighter 1.4 s, optional edge glow
- Wipe: all rebuilders out → tag team scores round

## E. BOI WIN
- 12/12 + 0.5 s in zone OR explicit Boi button when stack complete
- Package: hit-stop 0.35s, cream flash, all rebuilders jump, shout SFX, shock ring, score pop
- Round card → Continue (first to 3)

## F. CONTROLS MAP (touch + optional keys)
| input | knock | live tag | live rebuild |
| stick | move | move | move |
| BUILD / Place | — | — | enter build zoom-lock |
| Charge throw | knock | tag | — |
| Pass | — | oper | — |
| Swap | body swap | body swap | body swap |
| Cancel build | — | — | release / move |

FP look-drag right half; stick left. Portrait + landscape thumb zones.

## G. AI OVERVIEW (readable, not robotic)
- Arrival steering, separation, wander
- Knock AI delay randomized
- Tag AI: hunt / pass / hold mix
- Rebuild AI: pick with hesitate, carry with juke, place with zoom-equivalent timing
- Zone camp max 2

## H. JUICE BUDGET (medium-high, not extreme)
Layer: hit-stop + directional shake + particles + SFX per event severity. No juice that hides ball or pyramid.

## I. CAMERA
- FP: eye, bob, soft-assist toward ball when idle
- Build Mode: zoom lock (C2)
- 3P: duty-aware look, spread zoom, snap on round start
- Knock: bias toward pyramid

## J. AUDIO
List cues: throw, pass, catch, bounce, collapse, pity, pick, place, reject, tag, out, boi, wipe, danger sting, build tick. Web Audio OK; Atlas files OK if declared.

## K. FAILURE STATES / SOFTLOCKS
- Ball OOB return; shard OOB pull-in
- AFK 15 s hint
- Build Mode cancel always available
- Never trap player in zoom if tagged

# DELIVERABLES (mandatory format)
1. Research notes + citations [n]
2. Full state machine diagram (ASCII or mermaid): title done → knock → collapse → live(build/tag) → boi/wipe/timer → round → match
3. Throw spec (charge curve table, aim assist, AI error)
4. Knock/collapse spec (hit volumes, scatter, juice timeline 0–0.5s)
5. **Build Mode spec** (button, zoom-lock camera numbers, slot logic, cancel, progress)
6. **Danger warning spec** (triggers, distances, UI layers, AI dodge vs player warn)
7. Bot rebuild tree (pick → carry → threat check → dodge/place)
8. Controls table portrait + landscape
9. HUD spec in Build Mode vs free play
10. Copy deck EN + ID (≤12 words/line) including danger strings
11. Tuning numbers table (all locked values)
12. Cut list if 1 day left
13. Open questions ≤5

# SUCCESS CRISITERIA
- New player throws, sees stack fall, understands rebuild within 15 s
- Build zoom-lock feels like a deliberate commit, not a camera glitch
- Danger warning saves a player who is watching the stack, not the ball
- Bots look busy and fair, not frozen or teleporting
- Ball + pyramid always the two things you can find in frame
- “One more round” after Boi

No marketing fluff. Production numbers. Do not redesign title/roster/hompimpa.