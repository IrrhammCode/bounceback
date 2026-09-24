# BOUNCEBACK! — The Locked Style

> Chunky, tactile, glossy toy-capsule mechas and vibrant pinball arena obstacles with saturated candy neon trims, glossy reflective court surfaces, and bouncy rubberized bumper physics.

| Role | Hex | Where it belongs |
|---|---|---|
| Team Cyan (Player) | `0x27e5ff` | Player squad bodies, aura rings, trails, team goal |
| Team Coral (Opponent) | `0xff5268` | Enemy squad bodies, hazard warnings, enemy goal |
| Golden Overdrive | `0xffd166` | Double-point gates, combo multiplier rings, crown icons |
| Kinetic Purple | `0x8338ec` | Pinball bumpers, launch pads, trajectory guide rails |
| Stadium Barrier | `0x06d6a0` | Inflatable safety perimeters, arena curb bumpers |
| Obsidian Court | `0x111625` | Glossy reflective ground floor with subtle grid sheen |
| Visor Chrome | `0xe0f2fe` | Curved character faceplates with soft specular shine |
| Pure White Accent | `0xffffff` | Eye highlights, hit flashes, score numbers |

## Fixed Decisions
- **Units**: Metres.
  - Mecha Capsule: 1.6 m high, 0.85 m radius.
  - Pinball Bumper: 1.2 m high, 1.8 m diameter.
  - Scoring Energy Gate: 3.5 m wide, 4.0 m tall, 0.6 m depth.
  - Arena Pitch: 40.0 m length (Z), 26.0 m width (X), 1.2 m perimeter cushion height.
- Base at y = 0, centred on X and Z, forward faces +Z.
- Flat saturated base colors with soft roughness maps; procedural normal and roughness generated at load time.
- Character aesthetic: Adorable, chubby jellybean-capsule brawlers with mini robotic thruster packs, glossy visor screens, and glowing team halos.
- Material names from contract: `plastic_gloss`, `rubber`, `metal_painted`, `glass_frosted`, `neon_emissive`.
