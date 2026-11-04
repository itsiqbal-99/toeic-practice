"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cloud,
  UserRound,
  Check,
  LogOut,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { WorkspaceShell } from "./shell";
import { useOverview, FetchState } from "./common";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
export function AccountPage({
  signinFailed = false,
}: {
  signinFailed?: boolean;
}) {
  const { data, error, isPending, refetch } = useOverview(),
    client = useQueryClient(),
    router = useRouter();
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: (input: { goal: number | null; weeklyTarget: number }) =>
      api("/users/preferences", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      setNotice("Preferences saved.");
      void client.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      client.clear();
      router.push("/");
      router.refresh();
    },
  });
  const legacy = useMutation({
    mutationFn: (record: unknown) =>
      api("/attempts/import", { method: "POST", body: JSON.stringify(record) }),
    onSuccess: () => {
      setNotice(
        "Legacy practice imported. Scores were recomputed and your original data is unchanged.",
      );
      void client.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const importBrowser = async () => {
    try {
      const active = localStorage.getItem("practice-desk:active-attempt:v1"),
        result = localStorage.getItem("practice-desk:latest-result:v1");
      if (!active && !result) {
        setNotice(
          "No legacy practice was found at this web address. You can import an exported JSON file below.",
        );
        return;
      }
      if (active)
        await legacy.mutateAsync({ kind: "active", data: JSON.parse(active) });
      if (result)
        await legacy.mutateAsync({ kind: "result", data: JSON.parse(result) });
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "This legacy data could not be read. Your original data is unchanged.",
      );
    }
  };
  const merge = useMutation({
    mutationFn: () => api("/auth/merge-guest", { method: "POST" }),
    onSuccess: () => {
      client.clear();
      void refetch();
      setNotice(
        "Guest sessions added to your account. Your existing history was preserved.",
      );
    },
  });
  return (
    <WorkspaceShell
      title="Account & preferences"
      subtitle="MAKE THE WORKSPACE YOURS"
      action={
        <span className="header-tag">
          <UserRound />
          Your space
        </span>
      }
    >
      <FetchState
        loading={isPending}
        error={error}
        retry={() => void refetch()}
      />
      {signinFailed ? (
        <p className="inline-alert" role="alert">
          Google sign-in could not be completed. Try signing in again; your
          existing practice is still saved.
        </p>
      ) : null}
      {data ? (
        <div className="account-grid">
          <section className="panel">
            <div className="account-profile">
              <span className="avatar large">
                <UserRound />
              </span>
              <div>
                <h2>{data.user.name}</h2>
                <p>
                  {data.user.email ||
                    "Guest workspace · saved to this browser session"}
                </p>
              </div>
            </div>
            <hr />
            {data.user.guest ? (
              <>
                <div className="account-feature">
                  <Cloud />
                  <div>
                    <h3>Keep your learning with you</h3>
                    <p>
                      Sign in with Google to access your sessions and history
                      across devices. You choose whether to add existing guest
                      sessions.
                    </p>
                  </div>
                </div>
                {data.user.googleEnabled ? (
                  <a
                    className="button button--solid button--brand"
                    href="/api/v1/auth/google"
                  >
                    Continue with Google <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : (
                  <>
                    <Button disabled>Google sign-in unavailable</Button>
                    <p className="fine-print">
                      You can continue using guest practice. Google sign-in is
                      not available in this workspace yet.
                    </p>
                  </>
                )}
              </>
            ) : (
              <Button
                emphasis="outline"
                busy={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <LogOut />
                Sign out
              </Button>
            )}
            {data.user.mergeCount > 0 ? (
              <div className="notice merge-notice">
                <div>
                  <h3>Add your guest sessions?</h3>
                  <p>
                    {data.user.mergeCount} sessions from this browser can be
                    added to your account. Your existing history stays intact.
                  </p>
                  <Button busy={merge.isPending} onClick={() => merge.mutate()}>
                    Add guest sessions
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
          <section className="panel">
            <span className="step-label">LEARNING PREFERENCES</span>
            <h2>Give your practice a direction.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fields = new FormData(e.currentTarget);
                save.mutate({
                  goal: fields.get("goal") ? Number(fields.get("goal")) : null,
                  weeklyTarget: Number(fields.get("weeklyTarget")),
                });
              }}
            >
              <label className="field">
                <span>Target accuracy (%)</span>
                <input
                  type="number"
                  name="goal"
                  aria-label="Target accuracy (%)"
                  min="1"
                  max="100"
                  placeholder="e.g. 80"
                  defaultValue={data.preferences.goal ?? ""}
                />
                <small>
                  Leave blank to practice without an accuracy target.
                </small>
              </label>
              <label className="field">
                <span>Weekly question target</span>
                <input
                  type="number"
                  name="weeklyTarget"
                  aria-label="Weekly question target"
                  min="5"
                  max="500"
                  required
                  defaultValue={data.preferences.weeklyTarget}
                />
                <small>Counted from Monday, 00:00 UTC.</small>
              </label>
              <Button busy={save.isPending} type="submit">
                Save preferences <Check />
              </Button>
            </form>
          </section>
          <section className="panel">
            <span className="step-label">YOUR DATA</span>
            <h2>A copy for you.</h2>
            <p>
              Export the results currently shown in your workspace. No session
              credentials are included.
            </p>
            <Button
              emphasis="outline"
              onClick={() => {
                const blob = new Blob(
                  [
                    JSON.stringify(
                      {
                        exportedAt: new Date().toISOString(),
                        history: data.history,
                        preferences: data.preferences,
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "toeic-practice-history.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download />
              Export visible history
            </Button>
          </section>
        </div>
      ) : null}
      <section className="panel legacy-import">
        <span className="step-label">BRING YOUR PRACTICE WITH YOU</span>
        <h2>Import from the original app</h2>
        <p>
          With your consent, add an unfinished 100-question session or a saved
          result. Imports never replace account history, and the original data
          stays untouched. Imported results are labeled separately.
        </p>
        <div className="inline-actions">
          <Button
            emphasis="outline"
            busy={legacy.isPending}
            onClick={() => void importBrowser()}
          >
            Import this browser’s legacy practice
          </Button>
          <label className="field">
            <span>Or select an exported legacy JSON file</span>
            <input
              type="file"
              accept=".json,application/json"
              disabled={legacy.isPending}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 200000) {
                  setNotice("Choose a legacy JSON file smaller than 200 KB.");
                  return;
                }
                try {
                  const value = JSON.parse(await file.text());
                  await legacy.mutateAsync(
                    value.kind
                      ? value
                      : {
                          kind: value.attemptId ? "result" : "active",
                          data: value,
                        },
                  );
                } catch (error) {
                  setNotice(
                    error instanceof Error
                      ? error.message
                      : "The file could not be read.",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>
      {notice ? (
        <p className="success-notice" role="status">
          <Check />
          {notice}
        </p>
      ) : null}
      {save.error || logout.error || merge.error || legacy.error ? (
        <p className="inline-alert" role="alert">
          {(save.error || logout.error || merge.error || legacy.error)?.message}
        </p>
      ) : null}
    </WorkspaceShell>
  );
}
