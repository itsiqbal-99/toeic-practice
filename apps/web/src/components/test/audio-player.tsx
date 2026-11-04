"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Volume2,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import type { Clip } from "@toeic/shared";
import { timeLabel } from "@/lib/api";

export function AudioPlayer({
  clips,
  unitId,
  strict = false,
  played = false,
  onBegin,
}: {
  clips: Clip[];
  unitId: string;
  strict?: boolean;
  played?: boolean;
  onBegin?: () => Promise<unknown>;
}) {
  const audio = useRef<HTMLAudioElement>(null),
    playing = useRef(false),
    busy = useRef(false);
  const [authorized, setAuthorized] = useState(false),
    [clipIndex, setClipIndex] = useState(0);
  const [status, setStatus] = useState("idle"),
    [position, setPosition] = useState(0),
    [duration, setDuration] = useState(0);
  const clip = clips[clipIndex],
    locked = strict && played && !authorized;
  useEffect(
    () => () => {
      playing.current = false;
    },
    [],
  );
  const play = async (element: HTMLAudioElement) => {
    try {
      await element.play();
      setStatus("playing");
    } catch {
      playing.current = false;
      setStatus("error");
    }
  };
  const begin = async (restart = false) => {
    const element = audio.current;
    if (locked || !element || busy.current) return;
    if (status === "playing" && !strict && !restart) {
      element.pause();
      playing.current = false;
      setStatus("paused");
      return;
    }
    busy.current = true;
    setStatus("loading");
    try {
      if (!authorized) {
        await onBegin?.();
        setAuthorized(true);
      }
      playing.current = true;
      if (restart || status === "complete") {
        setPosition(0);
        if (clipIndex !== 0) {
          setClipIndex(0);
          return;
        }
        element.currentTime = 0;
      }
      await play(element);
    } catch {
      playing.current = false;
      setStatus("error");
    } finally {
      busy.current = false;
    }
  };
  const progress = duration ? Math.round((position / duration) * 100) : 0;
  return (
    <section className="audio-player" aria-label="Listening audio">
      {clip ? (
        <audio
          key={unitId + "-" + clipIndex}
          ref={audio}
          src={clip.src}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const value = e.currentTarget.duration;
            setDuration(Number.isFinite(value) ? value : 0);
          }}
          onCanPlay={(e) => {
            if (playing.current && e.currentTarget.paused)
              void play(e.currentTarget);
          }}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onEnded={() => {
            if (clipIndex + 1 < clips.length) {
              setClipIndex(clipIndex + 1);
              setPosition(0);
              setDuration(0);
              setStatus("loading");
            } else {
              playing.current = false;
              setStatus("complete");
            }
          }}
          onError={() => {
            playing.current = false;
            setStatus("error");
          }}
        />
      ) : null}
      <div className="audio-player-title">
        <span className="mini-icon">
          <Headphones />
        </span>
        <div>
          <strong>
            {locked
              ? "Audio already played"
              : status === "error"
                ? "Audio unavailable"
                : status === "complete"
                  ? "Playback complete"
                  : status === "playing"
                    ? "Now listening"
                    : "Listening audio"}
          </strong>
          <small>
            {strict
              ? "One playback · no pause or seeking"
              : "Replay and seeking available"}
            {clips.length > 1 ? ` · Clip ${clipIndex + 1}/${clips.length}` : ""}
          </small>
        </div>
        <Volume2 aria-hidden="true" />
      </div>
      {status === "error" ? (
        <p className="audio-error" role="alert">
          <AlertCircle aria-hidden="true" />
          The audio could not play. Check your connection and retry, or continue
          answering.
        </p>
      ) : null}
      <div className="audio-timeline">
        <button
          className="play-button"
          aria-label={
            locked
              ? "Audio already played"
              : status === "error"
                ? "Retry audio"
                : status === "playing" && !strict
                  ? "Pause audio"
                  : "Play audio"
          }
          disabled={
            !clip ||
            locked ||
            status === "loading" ||
            (strict && (status === "playing" || status === "complete"))
          }
          onClick={() => void begin()}
        >
          {locked ? (
            <LockKeyhole />
          ) : status === "playing" && !strict ? (
            <Pause />
          ) : status === "error" ? (
            <RotateCcw />
          ) : (
            <Play />
          )}
        </button>
        <div className="audio-track">
          {strict ? (
            <div
              className="bar-track"
              role="progressbar"
              aria-label="Audio playback progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: progress + "%" }} />
            </div>
          ) : (
            <input
              type="range"
              min="0"
              max={duration || 1}
              step=".1"
              value={Math.min(position, duration || 1)}
              disabled={!duration}
              aria-label="Audio position"
              onChange={(e) => {
                if (audio.current)
                  audio.current.currentTime = Number(e.target.value);
                setPosition(Number(e.target.value));
              }}
            />
          )}
          <div className="audio-time">
            <span>{timeLabel(position)}</span>
            <span>{timeLabel(duration)}</span>
          </div>
        </div>
        {!strict ? (
          <button
            className="icon-button"
            onClick={() => void begin(true)}
            aria-label="Restart audio"
            disabled={status === "loading"}
          >
            <RotateCcw />
          </button>
        ) : null}
      </div>
    </section>
  );
}
