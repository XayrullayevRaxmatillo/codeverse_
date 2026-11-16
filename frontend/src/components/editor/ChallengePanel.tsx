import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Circle,
  FlaskConical,
  Lightbulb,
  PartyPopper,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { Challenge, CodeFiles, Tri } from "../../types";
import { runTests, type TestResult } from "../../lib/sandbox";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useReward } from "../../context/RewardContext";
import { ApiError, errorMessage } from "../../lib/api";
import { markRun } from "../../hooks/api";
import { cn } from "../../lib/utils";
import { Markdown } from "../Markdown";
import { Playground } from "./Playground";
import { ConfirmDialog, DifficultyBadge, Spinner } from "../ui";
import { Confetti } from "../game/Confetti";
import { MentorDrawer } from "../MentorChat";

let runMarked = false;

export interface ChallengePanelProps {
  challenge: Challenge;
  initialCode?: CodeFiles | null;
  solvedBefore?: boolean;
  /** Muvaffaqiyatli testlardan keyin serverga yuborish (mehmon uchun — lokal) */
  onSolved: (code: CodeFiles) => Promise<{ explanation?: Tri } | void>;
  onAutosave?: (code: CodeFiles) => void;
  lessonId?: string;
  heading?: string;
}

export function ChallengePanel({
  challenge,
  initialCode,
  solvedBefore,
  onSolved,
  onAutosave,
  lessonId,
  heading,
}: ChallengePanelProps) {
  const { t, tx } = useSettings();
  const { user } = useAuth();
  const { celebrate } = useReward();
  const [files, setFiles] = useState<CodeFiles>(
    initialCode ?? challenge.starter,
  );
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState<string[] | null>(null);
  const [success, setSuccess] = useState<{ explanation?: Tri } | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    setFiles(initialCode ?? challenge.starter);
    setResults(null);
    setSuccess(null);
    setHintsShown(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  // Avtosaqlash (2.5 s kechikish bilan)
  const saveTimer = useRef<number>();
  useEffect(() => {
    if (!onAutosave || !user) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(
      () => onAutosave(filesRef.current),
      2500,
    );
    return () => window.clearTimeout(saveTimer.current);
  }, [files, onAutosave, user]);

  const onRun = useCallback(() => {
    if (user && !runMarked && user.stats.codeRuns === 0) {
      runMarked = true;
      markRun()
        .then((r) => celebrate(r.reward))
        .catch(() => undefined);
    }
  }, [user, celebrate]);

  async function check() {
    setChecking(true);
    setServerError(null);
    setRuntimeError(null);
    try {
      const out = await runTests({
        mode: challenge.mode,
        files: filesRef.current,
        tests: challenge.tests,
      });
      setResults(out.results);
      setRuntimeError(out.error);
      onRun();
      const passed = out.results.length > 0 && out.results.every((r) => r.ok);
      if (passed) {
        const r = await onSolved(filesRef.current);
        setSuccess(r ?? {});
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "RULES_FAILED") {
        const failed = (
          (e.details as { failed?: Tri[] } | undefined)?.failed ?? []
        )
          .map((d) => tx(d))
          .filter(Boolean);
        setServerError(failed.length ? failed : [e.message]);
      } else setServerError([errorMessage(e)]);
    } finally {
      setChecking(false);
    }
  }

  const failedCount = results ? results.filter((r) => !r.ok).length : 0;

  return (
    <section className="space-y-4" aria-labelledby={`ch-${challenge.id}`}>
      <div className="card p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2
            id={`ch-${challenge.id}`}
            className="flex items-center gap-2 text-lg font-extrabold"
          >
            <FlaskConical size={20} className="text-primary" />{" "}
            {heading ?? tx(challenge.title)}
          </h2>
          <DifficultyBadge difficulty={challenge.difficulty} />
          {solvedBefore && (
            <span className="chip border-success/40 text-success">
              <CheckCircle2 size={13} /> {t("lesson.solvedBefore")}
            </span>
          )}
        </div>
        <Markdown source={tx(challenge.instructions)} />

        <div className="mt-4">
          <p className="mb-2 text-sm font-bold">{t("lesson.tests")}</p>
          <ul className="space-y-1.5">
            {challenge.tests.map((test, i) => {
              const r = results?.[i];
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {r ? (
                    r.ok ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-success"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-danger"
                      />
                    )
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-muted" />
                  )}
                  <span className={cn(r && !r.ok && "text-danger")}>
                    {tx(test.d)}
                    {r?.error && (
                      <span className="block font-mono text-xs opacity-80">
                        {r.error}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {challenge.hints.length > 0 && (
          <div className="mt-4 space-y-2">
            {challenge.hints.slice(0, hintsShown).map((h, i) => (
              <p
                key={i}
                className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm"
              >
                <Lightbulb size={17} className="mt-0.5 shrink-0 text-warning" />{" "}
                {tx(h)}
              </p>
            ))}
            {hintsShown < challenge.hints.length && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setHintsShown((n) => n + 1)}
              >
                <Lightbulb size={15} /> {t("lesson.hintBtn")}
              </button>
            )}
          </div>
        )}
      </div>

      <Playground
        mode={challenge.mode}
        files={files}
        onChange={setFiles}
        onReset={() => setConfirmReset(true)}
        onRun={onRun}
        toolbarExtra={
          user ? (
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setMentorOpen(true)}
            >
              <Bot size={15} />{" "}
              <span className="hidden md:inline">{t("lesson.askMentor")}</span>
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-success h-12 px-6"
          onClick={check}
          disabled={checking}
        >
          {checking ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <CheckCircle2 size={18} />
          )}{" "}
          {checking ? t("lesson.checking") : t("lesson.check")}
        </button>
        {results && !success && (
          <p
            className={cn(
              "text-sm font-semibold",
              failedCount ? "text-danger" : "text-success",
            )}
            role="status"
          >
            {failedCount
              ? t("lesson.someFailed", { n: failedCount })
              : t("lesson.allPassed")}
          </p>
        )}
        {runtimeError && (
          <p className="w-full rounded-xl bg-danger/10 p-3 font-mono text-xs text-danger">
            {runtimeError}
          </p>
        )}
        {serverError && (
          <div
            className="w-full rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            role="alert"
          >
            <p className="flex items-center gap-2 font-bold">
              <ShieldAlert size={16} /> {t("lesson.serverRejected")}
            </p>
            <ul className="mt-1 list-disc pl-5">
              {serverError.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            className="card relative overflow-hidden border-success/60 p-6"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            role="status"
          >
            <Confetti count={40} />
            <div className="relative flex items-start gap-4">
              <motion.span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-success/20 text-success"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.8 }}
              >
                <PartyPopper size={28} />
              </motion.span>
              <div>
                <h3 className="text-xl font-extrabold text-success">
                  {t("lesson.allPassed")}
                </h3>
                {success.explanation && tx(success.explanation) && (
                  <Markdown
                    source={tx(success.explanation)}
                    className="mt-1 text-muted"
                  />
                )}
                {!success.explanation && tx(challenge.explanation) && (
                  <Markdown
                    source={tx(challenge.explanation)}
                    className="mt-1 text-muted"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        title={t("lesson.reset")}
        text={t("lesson.resetConfirm")}
        confirmLabel={t("lesson.reset")}
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setFiles(challenge.starter);
          setResults(null);
          setConfirmReset(false);
        }}
      />
      <MentorDrawer
        open={mentorOpen}
        onClose={() => setMentorOpen(false)}
        context={{
          lessonId,
          challengeId: challenge.id,
          getCode: () =>
            [filesRef.current.html, filesRef.current.css, filesRef.current.js]
              .filter(Boolean)
              .join("\n\n"),
          lastError: runtimeError,
        }}
      />
    </section>
  );
}
