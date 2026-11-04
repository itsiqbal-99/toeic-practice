# TOEIC Practice workspace design

## Direction

A light editorial learning workspace for adults studying workplace English. The root is a useful personal desk with authentic observations and immediate study actions. It has no promotional landing page, artificial achievements or fabricated charts.

## Foundation

The authored tokens map to apps/web/src/app/globals.css: porcelain #F8F7F3, white paper, charcoal #1D2433, slate #626C7C, cobalt #4258D6, pale cobalt #EDF0FF, apricot #F2AE8E, neutral border #E5E7ED, positive #286B50 and error #A43B40. Apricot identifies a supporting next-step panel. Cobalt identifies the primary action, selection and current navigation.

Manrope is served locally at weights 400–700. Source Serif 4 is reserved for reading passages. Question text is 17–18px; passage text is 16px with generous line spacing. Large metrics use tabular numbers. Small labels carry supplementary context rather than essential instructions.

Desktop uses a 228px sidebar, consistent working width and restrained white panels. Mobile has compact top controls, a five-item bottom navigation and an accessible drawer for account/full navigation. Larger panels have 12px corners; controls use 6–8px. Borders supply hierarchy; shadows are reserved for dialogs and the small diagnostic document illustration.

## Components and states

- Button owns solid, outline and ghost emphasis, busy dimensions, disabled state and focus treatment. Icon controls have accessible names.
- Radix Dialog owns modal semantics, focus trapping, Escape and restoration for drawers and submission. The first submit-dialog action returns to the test.
- FetchState handles stable skeleton loading and contextual retry errors. Empty states explain what data is needed and offer a relevant next action.
- MetricBar shows correct/total and accuracy. Early samples explicitly say that recommendations need five observations.
- HistoryChart loads only when needed, separates configuration cohorts, excludes imports, and offers an accessible data table.
- Native labeled selects, inputs, radio groups and switches keep familiar keyboard behavior. Answers retain constant geometry and a clear check/letter/border state.

## Workspace

The dashboard shows actual completed sessions, answered questions, accuracy, UTC weekly practice, resume state, performance cohorts, deterministic recommendations, targets, skills and activity. A first-time guest sees zeros, an unmeasured accuracy dash and useful diagnostic/practice actions.

The diagnostic is a compact action surface with an editorial paper motif. It never stands in for learner data. Supporting copy is concise and functional. Charts show no fictional points.

## Examination

The exam has a separate shell: compact header, answered progress, a readable main question, desktop answer sheet and fixed safe-area footer. Question position and answered count remain separate. Navigation cells identify current/answered/marked states through labels and shape as well as color.

Listening uses one consistent player, recovery messages and an explicit per-mode policy. Reading uses a sticky passage alongside questions on desktop, natural full-width documents on mobile, and distinct labels for multiple documents. The footer leaves sufficient scroll space for the last answer.

Results foreground accuracy and correct/incorrect/unanswered counts. Review progressively reveals explanation and original stimuli, with state, part and skill filters and a direct practice action.

## Motion

Motion for React owns short route entry and active-navigation transitions. CSS owns hover, selected controls, metric progress, dialogs/drawers, loading and completion feedback. Most changes last 140–350ms. Timed mock controls suppress selection/progress transitions. Reduced motion is honored by MotionConfig and a global media query; focus and semantic state do not depend on animation. Browser accessibility scans wait for finite entry animations to settle.

## Responsive and accessibility rules

At 960px the sidebar becomes mobile navigation and the answer sheet becomes a drawer. At 650px the dashboard is recomposed for narrow reading, metrics remain a useful 2×2 group, passage/questions stack, and action bars respect safe areas.

Every interactive control has keyboard focus. Information never depends solely on color. Contrast uses readable semantic colors; screen readers get answer progress, save state and dialog names. Automated WCAG 2.2 checks supplement keyboard and visual checks; they do not establish universal assistive-technology certification.
