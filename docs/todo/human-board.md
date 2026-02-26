# Human Board

> Human writes objectives and constraints here.
> VA Auto-Pilot reads this at the start of every cycle.
> Processed items must be marked `[x]`, never deleted.

---

## Instructions (highest priority)
- [x] Polish the demo mode animation: ensure smooth transitions between all 5 states (Backlog → In Progress → Review → Testing → Done) with distinct visual feedback for each
- [x] Add a particle/glow effect around the currently active state in the state machine visualization
- [x] Ensure the streaming JSON panel auto-scrolls smoothly and has a monospace font
- [x] Add subtle pulsing animation to active agent cards
- [x] Configure vite.config.ts with base path for GitHub Pages deployment (base: '/va-mission-control/')
- [x] Ensure all TypeScript strict mode passes with zero errors
- [x] Add GitHub Actions workflow (.github/workflows/deploy.yml) for automatic GitHub Pages deployment on push to main

## Feedback (to fold into next cycle)
- The dashboard should feel alive even when idle — subtle ambient animations
- Color scheme: use emerald green for success, amber for in-progress, red for failed, cyan for info

## Direction (long-term)
- This is the META showcase for va-wish-engine — it must be the most impressive of all 10 projects
