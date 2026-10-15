import React, { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LossLabSessionProvider, useLossLabSession } from "@/lib/session";

// React Testing Library only auto-cleans when vitest `globals` are enabled, which this project
// does not set. Without this, each test leaves its tree mounted and the next one sees duplicates.
afterEach(cleanup);

function SessionProbe() {
  const state = useLossLabSession();
  return <div><span data-testid="run-id">{state.result.runId}</span><span data-testid="phase">{state.phase}</span><span data-testid="cursor">{state.cursor}</span><span data-testid="exposure">{state.result.monthlyExposureCents}</span><button onClick={() => state.dispatch({ type: "START" })}>start-probe</button><button onClick={() => state.dispatch({ type: "NAVIGATE", tab: "reports" })}>navigate-probe</button><button onClick={() => state.dispatch({ type: "RERUN" })}>rerun-probe</button><button onClick={() => state.dispatch({ type: "RATE", rate: 4 })}>speed-probe</button><button onClick={() => state.dispatch({ type: "COMPLETE" })}>complete-probe</button></div>;
}

describe("shared app session run lifecycle", () => {
  it("preserves the same single run across tab changes and speed changes", () => {
    const { unmount } = render(<LossLabSessionProvider><SessionProbe /></LossLabSessionProvider>);
    const id = screen.getByTestId("run-id").textContent;
    fireEvent.click(screen.getByText("start-probe"));
    fireEvent.click(screen.getByText("navigate-probe"));
    fireEvent.click(screen.getByText("speed-probe"));
    expect(screen.getByTestId("run-id").textContent).toBe(id);
    expect(screen.getByTestId("phase").textContent).toBe("RUNNING");
    expect(screen.getByTestId("exposure").textContent).toBe("1243700");
    unmount();
  });

  it("re-running the suite reproduces an identical run id and exposure", () => {
    render(<LossLabSessionProvider><SessionProbe /></LossLabSessionProvider>);
    const id = screen.getByTestId("run-id").textContent;
    fireEvent.click(screen.getByText("rerun-probe"));
    expect(screen.getByTestId("run-id").textContent).toBe(id);
    expect(screen.getByTestId("exposure").textContent).toBe("1243700");
    expect(screen.getByTestId("phase").textContent).toBe("IDLE");
  });

  it("does not duplicate final event exposure when a run is completed early", () => {
    vi.useFakeTimers();
    render(<LossLabSessionProvider><SessionProbe /></LossLabSessionProvider>);
    fireEvent.click(screen.getByText("start-probe"));
    fireEvent.click(screen.getByText("complete-probe"));
    expect(screen.getByTestId("cursor").textContent).toBe("40");
    expect(screen.getByTestId("phase").textContent).toBe("COMPLETE");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByTestId("cursor").textContent).toBe("40");
    vi.useRealTimers();
  });
});
