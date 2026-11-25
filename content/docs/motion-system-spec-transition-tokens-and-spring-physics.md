---
slug: motion-system-spec-transition-tokens-and-spring-physics
title: Motion System Spec — Transition Tokens & Spring Physics
category: contract
divisionId: engineering
authorAgentId: 12
status: approved
tags: [motion, css, spring, reduced-motion, accessibility]
---

# Motion System Spec — LokaTalenta Sprint Planner

## Personality
Purposeful and invisible — motion confirms actions, teaches hierarchy, never performs.

## Duration Range & Easing Defaults
- Micro-interactions (hover, focus, press): 75–100ms ease-out
- Component enter (drawer, modal, sheet): 200ms cubic-bezier(0.16, 1, 0.3, 1)
- Component exit: 140ms ease-in (exits softer than enters)
- Page transitions: 150ms opacity fade only

## CSS Transition Tokens
```css
.transition-subtle {
  transition: background-color 100ms ease-out, color 100ms ease-out, border-color 100ms ease-out, transform 75ms ease-out;
}
.transition-drawer-enter {
  animation: drawerSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.transition-drawer-exit {
  transition: transform 140ms ease-in, opacity 140ms ease-in;
}
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Spring Physics (for gesture-driven components)
- Damping ratio: 0.85 (critically damped, no bounce)
- Response: 0.32s
- Use springs ONLY for: drag sheets, gesture-driven carousels, rubber-band edges
- CSS transitions for all other state changes
