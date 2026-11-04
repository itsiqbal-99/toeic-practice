"use client";
import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Attempt } from "@toeic/shared";
import { readPending, type Change, type Pending } from "./pending";
export function useAttempt(id: string) {
  const client = useQueryClient(),
    key = ["attempt", id],
    storageKey = "toeic:pending:" + id;
  const [pending, setPending] = useState<Pending | null>(() => {
    try {
      return readPending(localStorage.getItem(storageKey), id);
    } catch {
      return null;
    }
  });
  const [storageWarning, setStorageWarning] = useState("");
  const changing = useRef(false);
  const query = useQuery({
    queryKey: key,
    queryFn: () => api<Attempt>("/attempts/" + id),
    enabled: Boolean(id),
    staleTime: 0,
  });
  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPending(null);
  };
  const save = useMutation({
    mutationFn: async (record: Pending) => {
      const c = record.change;
      const path =
        c.kind === "answer"
          ? `/answers/${c.questionId}`
          : c.kind === "audio"
            ? `/audio/${c.unitId}`
            : "/progress";
      const body =
        c.kind === "answer"
          ? { revision: record.revision, choiceId: c.choiceId }
          : c.kind === "audio"
            ? { revision: record.revision }
            : {
                revision: record.revision,
                currentIndex: c.currentIndex,
                markedQuestionIds: c.markedQuestionIds,
              };
      try {
        return await api<Attempt>("/attempts/" + id + path, {
          method: c.kind === "audio" ? "POST" : "PATCH",
          body: JSON.stringify(body),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          const latest = await api<Attempt>("/attempts/" + id);
          client.setQueryData(key, latest);
          const applied =
            c.kind === "answer"
              ? latest.answers[c.questionId] === c.choiceId
              : c.kind === "audio"
                ? latest.audioPlayedUnitIds.includes(c.unitId)
                : (c.currentIndex === undefined ||
                    latest.currentIndex === c.currentIndex) &&
                  (c.markedQuestionIds === undefined ||
                    JSON.stringify([...latest.markedQuestionIds].sort()) ===
                      JSON.stringify([...c.markedQuestionIds].sort()));
          if (applied || latest.status === "completed") return latest;
        }
        throw error;
      }
    },
    onSuccess: (a) => {
      client.setQueryData(key, a);
      clear();
      void client.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const change = async (c: Change) => {
    if (!query.data || changing.current || save.isPending || pending)
      throw new Error("Save the pending change before continuing.");
    changing.current = true;
    const record = { id, revision: query.data.revision, change: c };
    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch {
      setStorageWarning(
        "This browser cannot keep an offline copy. Keep the tab open until saving completes.",
      );
    }
    setPending(record);
    try {
      return await save.mutateAsync(record);
    } finally {
      changing.current = false;
    }
  };
  let attempt = query.data;
  if (attempt && pending) {
    const c = pending.change;
    attempt = {
      ...attempt,
      answers:
        c.kind === "answer"
          ? { ...attempt.answers, [c.questionId]: c.choiceId }
          : attempt.answers,
      currentIndex:
        c.kind === "progress" && c.currentIndex !== undefined
          ? c.currentIndex
          : attempt.currentIndex,
      markedQuestionIds:
        c.kind === "progress" && c.markedQuestionIds
          ? c.markedQuestionIds
          : attempt.markedQuestionIds,
    };
  }
  return {
    ...query,
    attempt,
    change,
    pending,
    saving: save.isPending,
    saveError: save.error,
    storageWarning,
    retry: () => (pending ? save.mutateAsync(pending) : Promise.resolve()),
    discard: () => {
      clear();
      save.reset();
      void query.refetch();
    },
  };
}
