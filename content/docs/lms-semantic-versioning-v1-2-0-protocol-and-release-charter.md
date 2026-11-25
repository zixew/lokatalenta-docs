---
slug: lms-semantic-versioning-v1-2-0-protocol-and-release-charter
title: LMS Semantic Versioning Protocol & v1.2.0 Release Charter
category: architecture
divisionId: executive
authorAgentId: 0
status: approved
tags: [semver, lms, versioning, release, governance, v1.2.0]
---

# LMS Semantic Versioning Protocol & v1.2.0 Release Charter

## 1. Executive SemVer Standard
SemVer standard for LokaTalenta Learning Management System (LMS) and Talent Ecosystem follows strict three-component numbering: `MAJOR.MINOR.PATCH`.

```
  v 1 . 2 . 0
    │   │   └── PATCH: Hotfixes, bug fixes, zero interface changes (x.x.1)
    │   └────── MINOR: New features, backward-compatible enhancements (x.1.0)
    └────────── MAJOR: Breaking changes, architectural overhauls (1.0.0)
```

### Version Increment Triggers:
1. **PATCH (`x.x.1`):**
   - Critical bug fixes, security patches, styling fixes that do not change contract schemas or API signatures.
   - Example: Fixing CSS overflow at 375px or correcting a typo in an error message.
2. **MINOR (`x.1.0`):**
   - Backward-compatible feature releases, new REST API endpoints, non-breaking schema expansions, new 3D office rooms/visuals.
   - Example: Launching Candidate Talent Marketplace, Psychometric Simulation Engine, or Floor 2 Boardroom Holographic Dais (Sprint 20 -> LMS v1.2.0).
3. **MAJOR (`1.0.0`):**
   - Breaking API changes, major architectural migrations (e.g., total database switch, breaking contract changes, authentication rewrite).

## 2. Release v1.2.0 Governance
- **Current Version:** `v1.2.0` (Sprint 20 Active Target)
- **Previous Version:** `v1.1.0` (Sprint 18/19 Turso & Anti-Slop UI Release)
- **Sign-Off Authority:** Agent #0 Rizco Renova (Release Lead) & Agent #2 Pranadipa Wicaksana (Product Owner).
