"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { AUDIO_POLICY } from "@/features/test/config";
import type { AudioSequence } from "@/features/test/types";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function AudioPlayer({ sequence, sequenceKey }: { sequence: AudioSequence; sequenceKey: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [clipIndex, setClipIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error" | "complete">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const clip = sequence.clips[clipIndex];

  useEffect(() => {
    if (status !== "playing" || !audioRef.current) return;
    void audioRef.current.play().catch(() => setStatus("error"));
  }, [clipIndex, status]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === "playing") {
      audio.pause();
      setStatus("paused");
      return;
    }
    if (status === "complete") {
      setClipIndex(0);
      audio.currentTime = 0;
    }
    setStatus("loading");
    try {
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  };

  const restart = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setClipIndex(0);
    setCurrentTime(0);
    setStatus("loading");
    audio.currentTime = 0;
    try {
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  };

  const onEnded = () => {
    if (clipIndex < sequence.clips.length - 1) {
      setClipIndex((value) => value + 1);
      setCurrentTime(0);
      setDuration(0);
      setStatus("playing");
    } else {
      setStatus("complete");
      setCurrentTime(duration);
    }
  };

  if (!clip) {
    return <div className="audio-player audio-player--error" role="alert"><AlertCircle aria-hidden="true" /> Audio is unavailable for this question.</div>;
  }

  return (
    <section className="audio-player" aria-label="Listening audio">
      <audio
        ref={audioRef}
        key={`${sequenceKey}-${clipIndex}`}
        src={clip.src}
        preload="metadata"
        onLoadStart={() => setStatus((value) => value === "playing" ? value : "loading")}
        onCanPlay={() => setStatus((value) => value === "loading" ? "paused" : value)}
        onPlay={() => setStatus("playing")}
        onPause={() => setStatus((value) => value === "playing" ? "paused" : value)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => setStatus("error")}
      />
      <div className="audio-player__icon"><Volume2 aria-hidden="true" /></div>
      <div className="audio-player__body">
        <div className="audio-player__heading">
          <strong>{status === "error" ? "Audio unavailable" : status === "playing" ? "Playing" : status === "complete" ? "Playback complete" : "Listening audio"}</strong>
          {sequence.clips.length > 1 ? <span>Clip {clipIndex + 1} of {sequence.clips.length}</span> : null}
        </div>
        {status === "error" ? (
          <p role="alert">The audio file could not be loaded. You can retry or continue with the test.</p>
        ) : (
          <div className="audio-player__timeline">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={Math.min(currentTime, duration || 1)}
              aria-label="Audio position"
              disabled={!AUDIO_POLICY.allowSeeking || !duration}
              onChange={(event) => {
                if (audioRef.current) audioRef.current.currentTime = Number(event.target.value);
              }}
            />
            <span className="mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        )}
      </div>
      <div className="audio-player__actions">
        <button type="button" className="audio-control" onClick={status === "error" ? restart : toggle} aria-label={status === "playing" ? "Pause audio" : status === "error" ? "Retry audio" : "Play audio"}>
          {status === "playing" ? <Pause aria-hidden="true" /> : status === "error" ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button type="button" className="audio-control audio-control--secondary" onClick={restart} aria-label="Restart audio">
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
