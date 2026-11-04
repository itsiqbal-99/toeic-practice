"use client";
import Image from "next/image";
import { useState } from "react";
import { ImageOff, Check, FileText } from "lucide-react";
import type { Context, ChoiceId } from "@toeic/shared";
import { AudioPlayer } from "./audio-player";
export function StimulusView({
  context,
  strict = false,
  played = false,
  onAudioBegin,
  review = false,
}: {
  context: Context;
  strict?: boolean;
  played?: boolean;
  onAudioBegin?: () => Promise<unknown>;
  review?: boolean;
}) {
  const [failed, setFailed] = useState(false),
    s = context.unit.stimulus;
  if (s.kind === "none") return null;
  if (s.kind === "audio" || s.kind === "image-audio")
    return (
      <div className="listening-stimulus">
        {s.kind === "image-audio" ? (
          <div className="question-image">
            {failed ? (
              <div className="media-fallback" role="img" aria-label={s.alt}>
                <ImageOff />
                <strong>Photograph unavailable</strong>
                <p>{s.alt}</p>
              </div>
            ) : (
              <Image
                src={s.image}
                alt={s.alt}
                width={960}
                height={640}
                onError={() => setFailed(true)}
                priority
                sizes="(max-width: 700px) 100vw, 650px"
                unoptimized
              />
            )}
          </div>
        ) : null}
        <AudioPlayer
          key={context.unit.id}
          clips={s.audio.clips}
          unitId={context.unit.id}
          strict={strict}
          played={played}
          onBegin={onAudioBegin}
        />
        {review && s.transcript ? (
          <details className="transcript">
            <summary>Listening transcript</summary>
            <p>{s.transcript}</p>
          </details>
        ) : null}
      </div>
    );
  const documents =
    s.kind === "passage"
      ? [
          {
            title: s.title,
            body: s.body,
            label: s.sourceLabel || "Reading passage",
          },
        ]
      : s.documents;
  return (
    <div className="document-stack">
      {documents.map((d, i) => (
        <article className="passage-card" key={i}>
          <div className="document-label">
            <FileText aria-hidden="true" />
            {d.label}
          </div>
          <h2>{d.title}</h2>
          <div className="passage-copy">
            {d.body.split("\n").map((line, i) => (
              <p key={i}>{line || "\u00a0"}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
export function QuestionRenderer({
  context,
  selectedChoice,
  onAnswer,
  disabled = false,
  strict = false,
  played = false,
  onAudioBegin,
}: {
  context: Context;
  selectedChoice?: ChoiceId;
  onAnswer: (id: ChoiceId) => void;
  disabled?: boolean;
  strict?: boolean;
  played?: boolean;
  onAudioBegin?: () => Promise<unknown>;
}) {
  const reading = ["passage", "documents"].includes(context.unit.stimulus.kind);
  return (
    <div
      className={
        reading ? "question-layout question-layout--reading" : "question-layout"
      }
    >
      <div className="stimulus-region">
        <StimulusView
          key={context.unit.id}
          context={context}
          strict={strict}
          played={played}
          onAudioBegin={onAudioBegin}
        />
      </div>
      <section
        className="question-card"
        aria-labelledby={"question-" + context.question.id}
      >
        <span className="question-card__number">
          QUESTION {String(context.index + 1).padStart(2, "0")}
        </span>
        <h2 id={"question-" + context.question.id}>
          {context.question.prompt}
        </h2>
        <fieldset className="choices" disabled={disabled}>
          <legend className="sr-only">Choose one answer</legend>
          {context.question.choices.map((choice) => (
            <label
              key={choice.id}
              className={
                "choice " +
                (selectedChoice === choice.id ? "choice--selected" : "")
              }
            >
              <input
                type="radio"
                name={"answer-" + context.question.id}
                value={choice.id}
                checked={selectedChoice === choice.id}
                onChange={() => onAnswer(choice.id)}
              />
              <span className="choice-letter">{choice.id}</span>
              <span>{choice.text}</span>
              {selectedChoice === choice.id ? (
                <Check className="choice-check" aria-hidden="true" />
              ) : null}
            </label>
          ))}
        </fieldset>
        <p className="question-hint">
          Select one answer. Use the arrow keys within the choices.
        </p>
      </section>
    </div>
  );
}
