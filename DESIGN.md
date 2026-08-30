---
version: alpha
name: "Practice Desk"
description: "A calm professional English examination desk with the precision of a paper answer sheet."
colors:
  ink: "#142A33"
  muted: "#5C6E75"
  mineral: "#F2F6F6"
  paper: "#FFFFFF"
  teal: "#0D686E"
  success: "#2F765C"
  review: "#B67622"
  danger: "#B34848"
typography:
  sans:
    fontFamily: "IBM Plex Sans, Arial, sans-serif"
  reading:
    fontFamily: "Source Serif 4, Georgia, serif"
  mono:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
rounded:
  sm: "0.375rem"
  DEFAULT: "0.625rem"
  lg: "1rem"
spacing:
  control: "0.75rem"
  panel: "1.5rem"
  section: "2.5rem"
  page-max: "90rem"
components:
  button:
    height: "2.75rem"
  input:
    height: "3rem"
  card:
    radius: "1rem"
  dialog:
    maxWidth: "32rem"
---

# Practice Desk Design System

## Overview

### Creative North Star

Practice Desk should feel like sitting at a well-organized professional testing station: cool mineral surfaces, a crisp paper examination sheet, precise labels, and a visible answer grid. The interface is focused enough for a long session without feeling institutional or severe.

### Product context and register

- **Audience and primary job:** Adult English learners completing an independent Listening and Reading practice assessment and understanding the result.
- **Target market and evidence:** Global English-language MVP, defined by the product brief; no market-specific business behavior.
- **Locale and language policy:** English-only UI and original English test content in v1.
- **Usage scene:** Primarily laptop/desktop for a 60–75 minute practice session, with a complete mobile adaptation.
- **Register:** Product-first. The landing route may introduce the test, but it remains a candidate briefing rather than a marketing campaign.
- **Memorable signature:** The numbered answer-sheet grid, whose filled, current, and review-ring states remain consistent throughout the attempt.
- **Restraint:** Questions, passages, answer choices, and media controls use familiar examination patterns with minimal motion.
- **Anti-references:** No classroom gamification, generic admin dashboard, glass panels, decorative gradients, or chart-heavy score reporting.
- **Token ownership/runtime mapping:** This file is the authored source. Exact values map one-to-one to custom properties in `src/app/globals.css`; shared components consume semantic variables only.

## Colors

Ink and muted blue-gray carry text hierarchy. Mineral is the application ground and paper is the reading surface. Teal is reserved for the current/primary path, green means answered or positive, amber means marked for review, and red is limited to errors. Current, answered, and review states always include shape or text in addition to color.

## Typography

IBM Plex Sans owns navigation, instructions, controls, and explanatory copy. Source Serif 4 is reserved for passages and document-like stimuli. IBM Plex Mono carries question indices, compact metrics, and score data. Passage measure is capped near 70 characters with generous line height; control labels use sentence case.

## Layout

The application uses a centered 90rem working area. The active test pairs a flexible examination surface with a 20rem answer-sheet rail at wide widths. At narrow widths the rail becomes a modal drawer and the actions become a safe-area-aware sticky bar. Media dimensions, feedback, scrollbars, and sticky controls reserve space to prevent reflow.

## Elevation & Depth

Hierarchy comes primarily from tonal surfaces and borders. Static cards use one restrained shadow; raised overlays use a deeper neutral shadow and an opaque backdrop. Blur and glass effects are forbidden.

## Shapes

Controls use a 0.625rem working radius and larger panels use 1rem. Answer-sheet buttons are near-circular but retain enough width for two- and three-digit numbers. Dividers are crisp one-pixel strokes.

## Components

### Foundational visual states

Every target defines default, hover, focus-visible, pressed, disabled, busy, selected/current, success, review, and error behavior where applicable. Focus uses a two-pixel teal ring with offset. Loading uses a stable inline spinner; skeletons are not part of v1.

### Buttons and actions

Buttons combine solid/outline/ghost emphasis with brand/neutral/danger intent. Each decision area has one solid primary action. Busy controls preserve dimensions. Icon-only buttons require accessible names.

### Navigation and data display

The answer-sheet grid is the canonical question navigator. Desktop keeps it visible; mobile opens the same component in a right-side modal drawer. Score breakdowns use labeled horizontal meters rather than chart chrome.

### Forms and overlays

Fields use visible labels, app-owned inline validation, and stable error space. Product forms use `noValidate`. Radix Dialog is the canonical modal owner for submission, attempt replacement, and mobile navigation, with focus containment, Escape handling, inert background, and restoration.

### Iconography

Lucide is the sole icon family, using 1.75px strokes at 18–20px. Icons support labels rather than replacing unfamiliar actions.

### Motion

Motion is limited to 160–220ms color, opacity, and short overlay transitions. It communicates selection and layer changes; reduced-motion removes transforms and shortens fades.

### Content and data visualization

Copy is direct, calm, and candidate-facing. Actions describe their outcome: “Start practice test”, “Submit test”, and “Return to test”. Scores always say “Estimated” and meters include numeric text.

## Do's and Don'ts

- **Do:** Keep the answer sheet visible or one action away throughout the attempt.
- **Do:** Preserve passage readability and stable controls during long sessions.
- **Don't:** turn assessment progress into rewards, streaks, confetti, or decorative animation.
- **Don't:** use color alone to distinguish answer, review, or error states.
