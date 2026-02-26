# VA Mission Control

NASA mission-control inspired real-time dashboard for visualizing the va-wish-engine pipeline.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion
- Recharts

## Features

- 3 primary panels: Wish Pipeline, Agent Status, Quality Gates
- 15-second Demo Mode end-to-end sequence
- Animated state machine transitions: Backlog -> In Progress -> Review -> Testing -> Done
- Real-time streaming JSON log with smooth auto-scroll
- Dark terminal/hacker aesthetic
- Responsive layout for desktop and tablet
- Self-contained simulated data flow
- WebSocket hook interface for future live integration

## Commands

```bash
npm run dev
npm run build
npm run preview
```

`vite.config.ts` sets dev server port to `3000`.
