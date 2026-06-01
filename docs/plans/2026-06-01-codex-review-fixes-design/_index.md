# Codex Review Fixes Design

## Context

PR #4 (`feature/frontend-optimization`) received 9 automated review suggestions from Codex. These are regressions or oversights introduced by the frontend optimization work (Tasks #1-#10). All 9 issues are concrete bugs with clear fixes — no architectural redesign needed.

**Current state**: PR builds and passes CI, but has runtime correctness issues on mobile, CI offline environments, and bundle optimization gaps.

**Target state**: All 9 Codex suggestions resolved, no regressions, build + lint + tests pass.

## Requirements

1. Font loading must work in offline CI environments
2. FloatingHeader must be visible at scroll=0 on all browsers
3. Page transition wrapper must not break flex layout
4. Safe area padding must not clip scroll content
5. Supabase realtime channel must survive individual component unmounts
6. Image sizes must align with actual breakpoints
7. LazyMotion feature bundles must match component needs
8. Root template must use lazy-loaded motion for bundle parity

## Design Documents

- [BDD Specifications](./bdd-specs.md) - Behavior scenarios and testing strategy
- [Architecture](./architecture.md) - System architecture and component details
- [Best Practices](./best-practices.md) - Security, performance, and code quality guidelines
