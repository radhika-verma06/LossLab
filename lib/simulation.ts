import type { RunResult, SimulationEvent } from "./types";

/** Playback is a presentation clock only. Event identities, offsets and exposure always come from RunResult. */
export function buildSimulationEvents(result: Readonly<RunResult>, _playbackRate = 1): readonly SimulationEvent[] {
  return result.events;
}

export function eventPresentationDelayMs(event: SimulationEvent, playbackRate: number): number {
  const safeRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  return event.sequence === 1 ? 0 : Math.round((event.offsetSeconds - (event.sequence - 2)) * 1000 / safeRate);
}
