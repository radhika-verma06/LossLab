"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { getProfile, PROFILE_IDS } from "./data";
import { GUARDRAIL_IDS, PROPOSED_GUARDRAILS } from "./policies";
import { runRiskEngine } from "./risk-engine";
import { replayWithGuardrails } from "./remediation";
import type { GuardrailId, ProfileId, RemediationResult, RunResult } from "./types";

export type TabId = "overview" | "run" | "reports" | "integrations";
export type RunPhase = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETE";
interface SessionState {
  profileId: ProfileId;
  activeTab: TabId;
  result: Readonly<RunResult>;
  phase: RunPhase;
  cursor: number;
  playbackRate: 1 | 4;
  selectedFindingId: string | null;
  selectedGuardrails: readonly GuardrailId[];
  volumeMultiplier: number;
  reducedMotion: boolean;
}
type Action =
  | { type: "SELECT_PROFILE"; profileId: ProfileId }
  | { type: "NAVIGATE"; tab: TabId }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ADVANCE" }
  | { type: "COMPLETE" }
  | { type: "REPLAY" }
  | { type: "RERUN" }
  | { type: "RATE"; rate: 1 | 4 }
  | { type: "VOLUME"; value: number }
  | { type: "TOGGLE_GUARDRAIL"; id: GuardrailId }
  | { type: "APPLY_GUARDRAILS"; ids: readonly GuardrailId[] }
  | { type: "SELECT_FINDING"; id: string | null }
  | { type: "REDUCED_MOTION"; value: boolean };

function makeResult(profileId: ProfileId, volume: number, guardrails: readonly GuardrailId[]) {
  return runRiskEngine({ profileId, volumeMultiplier: volume, guardrails });
}
function initialState(): SessionState {
  return {
    profileId: "skybridge", activeTab: "overview", result: makeResult("skybridge", 1, []),
    phase: "IDLE", cursor: 0, playbackRate: 1, selectedFindingId: null,
    selectedGuardrails: [], volumeMultiplier: 1, reducedMotion: false,
  };
}
function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SELECT_PROFILE": {
      if (!PROFILE_IDS.includes(action.profileId)) return state;
      return { ...state, profileId: action.profileId, result: makeResult(action.profileId, state.volumeMultiplier, state.selectedGuardrails), phase: "IDLE", cursor: 0, selectedFindingId: null };
    }
    case "NAVIGATE": return { ...state, activeTab: action.tab };
    case "START": return { ...state, phase: "RUNNING", cursor: 0, selectedFindingId: null };
    case "PAUSE": return state.phase === "RUNNING" ? { ...state, phase: "PAUSED" } : state;
    case "RESUME": return state.phase === "PAUSED" ? { ...state, phase: "RUNNING" } : state;
    case "ADVANCE": {
      if (state.phase !== "RUNNING") return state;
      const cursor = Math.min(state.cursor + 1, state.result.events.length);
      return { ...state, cursor, phase: cursor >= state.result.events.length ? "COMPLETE" : "RUNNING" };
    }
    case "COMPLETE": return { ...state, cursor: state.result.events.length, phase: "COMPLETE" };
    case "REPLAY": return { ...state, cursor: 0, phase: "RUNNING", selectedFindingId: null };
    case "RERUN": return {
      ...state,
      result: makeResult(state.profileId, state.volumeMultiplier, state.selectedGuardrails),
      phase: "IDLE",
      cursor: 0,
      selectedFindingId: null,
    };
    case "RATE": return { ...state, playbackRate: action.rate };
    case "VOLUME": {
      const volumeMultiplier = Math.max(0.5, Math.min(2, Math.round(action.value * 100) / 100));
      return { ...state, volumeMultiplier, result: makeResult(state.profileId, volumeMultiplier, state.selectedGuardrails), cursor: 0, phase: "IDLE", selectedFindingId: null };
    }
    case "TOGGLE_GUARDRAIL": {
      const selectedGuardrails = state.selectedGuardrails.includes(action.id)
        ? state.selectedGuardrails.filter((id) => id !== action.id)
        : GUARDRAIL_IDS.filter((id) => state.selectedGuardrails.includes(id) || id === action.id);
      return { ...state, selectedGuardrails, result: makeResult(state.profileId, state.volumeMultiplier, selectedGuardrails), cursor: 0, phase: "IDLE", selectedFindingId: null };
    }
    case "APPLY_GUARDRAILS": {
      const selectedGuardrails = GUARDRAIL_IDS.filter((id) => action.ids.includes(id));
      const result = makeResult(state.profileId, state.volumeMultiplier, selectedGuardrails);
      const isComplete = state.phase === "COMPLETE";
      return { ...state, selectedGuardrails, result, cursor: isComplete ? result.events.length : 0, phase: isComplete ? "COMPLETE" : "IDLE", selectedFindingId: null };
    }
    case "SELECT_FINDING": return { ...state, selectedFindingId: action.id };
    case "REDUCED_MOTION": return { ...state, reducedMotion: action.value };
  }
}

interface SessionContextValue extends SessionState {
  readonly profile: ReturnType<typeof getProfile>;
  readonly visibleEvents: Readonly<RunResult["events"]>;
  readonly selectedScenario: RunResult["scenarios"][number] | null;
  readonly remediation: Readonly<RemediationResult>;
  readonly dispatch: (action: Action) => void;
}
const SessionContext = createContext<SessionContextValue | null>(null);

export function LossLabSessionProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => dispatch({ type: "REDUCED_MOTION", value: preference.matches });
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (state.phase !== "RUNNING") return;
    const delay = state.reducedMotion ? 60 : Math.max(60, 1000 / state.playbackRate);
    const timer = window.setTimeout(() => dispatch({ type: "ADVANCE" }), delay);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.cursor, state.playbackRate, state.reducedMotion]);

  const selectFinding = useCallback((id: string | null) => dispatch({ type: "SELECT_FINDING", id }), []);
  const value = useMemo<SessionContextValue>(() => {
    const baseline = makeResult(state.profileId, state.volumeMultiplier, []);
    const remediation = replayWithGuardrails(baseline, state.selectedGuardrails);
    return {
      ...state,
      profile: getProfile(state.profileId),
      visibleEvents: state.result.events.slice(0, state.cursor),
      selectedScenario: state.selectedFindingId ? state.result.scenarios.find((scenario) => scenario.id === state.selectedFindingId) ?? null : null,
      remediation,
      dispatch: (action) => action.type === "SELECT_FINDING" ? selectFinding(action.id) : dispatch(action),
    };
  }, [state, selectFinding]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useLossLabSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useLossLabSession must be used inside LossLabSessionProvider.");
  return value;
}
