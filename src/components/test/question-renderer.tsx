"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { AudioPlayer } from "./audio-player";
import type { Choice, QuestionContext } from "@/features/test/types";

function StimulusView({ context }: { context: QuestionContext }) {
  const [imageError, setImageError] = useState(false);
  const { stimulus } = context.unit;

  if (stimulus.kind === "none") return null;
  if (stimulus.kind === "image-audio") {
    return (
      <div className="stimulus stimulus--media">
        <div className="question-image">
          {imageError ? (
            <div className="media-fallback" role="img" aria-label={stimulus.alt}>
              <ImageOff aria-hidden="true" />
              <strong>Photograph unavailable</strong>
              <span>{stimulus.alt}</span>
            </div>
          ) : (
            <Image src={stimulus.image} alt={stimulus.alt} fill sizes="(max-width: 1024px) 100vw, 760px" unoptimized onError={() => setImageError(true)} priority={context.index < 2} />
          )}
        </div>
        <AudioPlayer key={context.unit.id} sequence={stimulus.audio} sequenceKey={context.unit.id} />
      </div>
    );
  }
  if (stimulus.kind === "audio") return <div className="stimulus"><AudioPlayer key={context.unit.id} sequence={stimulus.audio} sequenceKey={context.unit.id} /></div>;
  if (stimulus.kind === "passage") {
    return (
      <article className="passage-card">
        {stimulus.sourceLabel ? <span className="document-label">{stimulus.sourceLabel}</span> : null}
        <h2>{stimulus.title}</h2>
        <div className="passage-copy">{stimulus.body.split("\n").map((line, index) => <p key={`${line}-${index}`}>{line || "\u00a0"}</p>)}</div>
      </article>
    );
  }
  return (
    <div className="document-stack">
      {stimulus.documents.map((document) => (
        <article className="passage-card" key={`${context.unit.id}-${document.label}`}>
          <span className="document-label">{document.label}</span>
          <h2>{document.title}</h2>
          <div className="passage-copy">{document.body.split("\n").map((line, index) => <p key={`${line}-${index}`}>{line || "\u00a0"}</p>)}</div>
        </article>
      ))}
    </div>
  );
}

export function QuestionRenderer({ context, selectedChoice, onAnswer }: { context: QuestionContext; selectedChoice?: Choice["id"]; onAnswer: (choice: Choice["id"]) => void }) {
  const listeningLabelsOnly = context.unit.part === "photographs" || context.unit.part === "question-response";
  return (
    <div className={`question-layout ${context.unit.stimulus.kind === "passage" || context.unit.stimulus.kind === "documents" ? "question-layout--reading" : ""}`}>
      <StimulusView context={context} />
      <section className="question-card" aria-labelledby={`question-${context.question.id}`}>
        <span className="question-card__number mono">Question {context.index + 1}</span>
        <h2 id={`question-${context.question.id}`}>{context.question.prompt}</h2>
        <fieldset className="choices">
          <legend className="sr-only">Choose one answer</legend>
          {context.question.choices.map((choice) => {
            const displayText = listeningLabelsOnly
              ? `${context.unit.part === "photographs" ? "Statement" : "Response"} ${choice.id}`
              : choice.text;
            return (
              <label className={`choice ${selectedChoice === choice.id ? "choice--selected" : ""}`} key={choice.id}>
                <input type="radio" name={`answer-${context.question.id}`} value={choice.id} checked={selectedChoice === choice.id} onChange={() => onAnswer(choice.id)} />
                <span className="choice__letter mono">{choice.id}</span>
                <span>{displayText}</span>
              </label>
            );
          })}
        </fieldset>
      </section>
    </div>
  );
}
