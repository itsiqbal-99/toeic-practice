import type { AttemptSession, QuestionContext } from "@/features/test/types";

export function QuestionNavigator({ session, contexts, onNavigate }: { session: AttemptSession; contexts: QuestionContext[]; onNavigate: (index: number) => void }) {
  return (
    <nav className="question-navigator" aria-label="Question navigator">
      <div className="question-navigator__legend" aria-label="Question status legend">
        <span><i className="legend-dot legend-dot--answered" /> Answered</span>
        <span><i className="legend-dot legend-dot--review" /> Review</span>
      </div>
      {(["listening", "reading"] as const).map((section) => {
        const sectionContexts = contexts.filter((context) => context.unit.section === section);
        return (
          <section key={section} className="navigator-section" aria-labelledby={`navigator-${section}`}>
            <div className="navigator-section__heading">
              <h3 id={`navigator-${section}`}>{section === "listening" ? "Listening" : "Reading"}</h3>
              <span>{sectionContexts.filter(({ question }) => session.answers[question.id]).length}/{sectionContexts.length}</span>
            </div>
            <div className="answer-grid">
              {sectionContexts.map((context) => {
                const isCurrent = context.index === session.currentIndex;
                const answered = Boolean(session.answers[context.question.id]);
                const marked = session.markedQuestionIds.includes(context.question.id);
                const states = [isCurrent && "answer-cell--current", answered && "answer-cell--answered", marked && "answer-cell--marked"].filter(Boolean).join(" ");
                return (
                  <button
                    type="button"
                    className={`answer-cell ${states}`}
                    key={context.question.id}
                    onClick={() => onNavigate(context.index)}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Question ${context.index + 1}${answered ? ", answered" : ", unanswered"}${marked ? ", marked for review" : ""}`}
                  >
                    {context.index + 1}
                    {marked ? <span className="answer-cell__mark" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
