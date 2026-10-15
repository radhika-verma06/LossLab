"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, InstancedMesh, MathUtils, Mesh, Object3D, Vector3, type MeshStandardMaterial } from "three";
import type { RunResult, Severity } from "@/lib/types";

const CYAN = new Color("#37f0d0");
const RED = new Color("#ff4545");
const ORANGE = new Color("#ffbf5b");
const MARKER_SCALE: Record<Severity, number> = { Low: 0.048, Medium: 0.062, High: 0.078, Critical: 0.098 };
const SEED_VECTORS = Array.from({ length: 320 }, (_, index) => {
  const random = (shift: number) => {
    const raw = Math.sin((index + 1) * 127.1 + shift * 311.7) * 43758.5453;
    return raw - Math.floor(raw);
  };
  const y = random(2) * 2 - 1;
  const phi = random(5) * Math.PI * 2;
  const radius = 2.05 + random(9) * 1.05;
  const horizontal = Math.sqrt(1 - y * y);
  return new Vector3(radius * horizontal * Math.cos(phi), radius * y, radius * horizontal * Math.sin(phi));
});
const TEMP = new Object3D();
const ORIGIN = new Vector3();

function resolvePosition(index: number, radius: number): Vector3 {
  const seed = SEED_VECTORS[index % SEED_VECTORS.length]!;
  return seed.clone().normalize().multiplyScalar(radius);
}

function ParticleField({ result, cursor, reducedMotion }: { result: Readonly<RunResult>; cursor: number; reducedMotion: boolean }) {
  const passing = useRef<InstancedMesh>(null);
  const failing = useRef<InstancedMesh>(null);
  const positions = useMemo(() => SEED_VECTORS.map((_, index) => resolvePosition(index, 2.05 + SEED_VECTORS[index]!.length() * 0.22)), []);
  useEffect(() => {
    if (passing.current) {
      passing.current.count = Math.max(0, 320 - result.violations);
      for (let index = 0; index < passing.current.count; index += 1) {
        TEMP.position.copy(positions[index]!);
        TEMP.scale.setScalar(index % 9 === 0 ? 0.023 : 0.011);
        TEMP.updateMatrix();
        passing.current.setMatrixAt(index, TEMP.matrix);
      }
      passing.current.instanceMatrix.needsUpdate = true;
    }
    if (failing.current) {
      failing.current.count = Math.min(result.violations, 28);
      const failures = result.scenarios.filter((scenario) => !scenario.evaluation.passed);
      for (let index = 0; index < failing.current.count; index += 1) {
        const finding = failures[index % failures.length]!;
        TEMP.position.copy(resolvePosition(index + 2, 1.78 + (index % 4) * 0.11));
        TEMP.scale.setScalar(MARKER_SCALE[finding.severity] * 0.5);
        TEMP.updateMatrix();
        failing.current.setMatrixAt(index, TEMP.matrix);
        failing.current.setColorAt(index, finding.severity === "Critical" ? RED : ORANGE);
      }
      failing.current.instanceMatrix.needsUpdate = true;
      if (failing.current.instanceColor) failing.current.instanceColor.needsUpdate = true;
    }
  }, [result, positions]);
  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (passing.current) passing.current.rotation.y += delta * 0.025;
    if (failing.current) failing.current.rotation.y += delta * 0.04;
    const pulse = 1 + (cursor % 8 === 0 && cursor > 0 ? Math.max(0, Math.sin(performance.now() * 0.008)) * 0.16 : 0);
    if (passing.current) passing.current.scale.setScalar(pulse);
  });
  return <>
    <instancedMesh ref={passing} args={[undefined, undefined, 320]}>
      <sphereGeometry args={[1, 5, 5]} /><meshBasicMaterial color={CYAN} toneMapped={false} transparent opacity={0.58} />
    </instancedMesh>
    <instancedMesh ref={failing} args={[undefined, undefined, 28]}>
      <octahedronGeometry args={[1, 0]} /><meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.88} />
    </instancedMesh>
  </>;
}

function CoreBody({ severityRatio, cursor, reducedMotion }: { severityRatio: number; cursor: number; reducedMotion: boolean }) {
  const core = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);
  const color = useRef(new Color("#37f0d0"));
  useFrame((_, delta) => {
    const amount = MathUtils.smoothstep(severityRatio, 0.03, 0.56);
    color.current.copy(CYAN).lerp(RED, amount);
    if (core.current) {
      const material = core.current.material as MeshStandardMaterial;
      material.color.copy(color.current);
      material.emissive.copy(color.current);
      material.emissiveIntensity = 1.05 + ((cursor % 8 === 0 && cursor > 0) ? 0.42 : 0) + amount * 0.3;
      if (!reducedMotion) core.current.rotation.y += delta * 0.09;
    }
    if (shell.current && !reducedMotion) {
      shell.current.rotation.x += delta * 0.025;
      shell.current.rotation.y -= delta * 0.041;
    }
  });
  return <>
    <mesh ref={core}><icosahedronGeometry args={[0.73, 5]} /><meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.1} roughness={0.28} metalness={0.42} toneMapped={false} /></mesh>
    <mesh ref={shell} scale={1.16}><icosahedronGeometry args={[0.85, 2]} /><meshBasicMaterial color="#73ffe8" wireframe transparent opacity={0.13} /></mesh>
    <mesh scale={1.07}><icosahedronGeometry args={[0.79, 1]} /><meshBasicMaterial color="#42cdb7" wireframe transparent opacity={0.16} /></mesh>
    <mesh rotation={[Math.PI / 2.55, 0.18, 0]}><torusGeometry args={[1.07, 0.008, 5, 164]} /><meshBasicMaterial color="#389e97" transparent opacity={0.62} /></mesh>
    <mesh rotation={[0.2, 0.16, Math.PI / 2.4]}><torusGeometry args={[1.27, 0.004, 4, 180]} /><meshBasicMaterial color="#2e7070" transparent opacity={0.4} /></mesh>
    <mesh rotation={[Math.PI / 2.15, -0.16, 0.4]}><torusGeometry args={[1.46, 0.003, 3, 180]} /><meshBasicMaterial color="#26474f" transparent opacity={0.42} /></mesh>
    <pointLight color={color.current} intensity={8} distance={5.5} decay={2.2} />
  </>;
}

function FindingMarkers({ result, onSelect, selectedId, reducedMotion }: { result: Readonly<RunResult>; onSelect: (id: string) => void; selectedId: string | null; reducedMotion: boolean }) {
  const markers = useMemo(() => result.scenarios.flatMap((scenario, index) => {
    if (scenario.evaluation.passed) return [];
    const phi = index * 2.399963229728653;
    const y = 1 - 2 * ((index + 0.5) / Math.max(1, result.violations));
    const scale = Math.sqrt(1 - y * y);
    const position = new Vector3(Math.cos(phi) * scale * 1.85, y * 1.85, Math.sin(phi) * scale * 1.85);
    return [{ scenario, position, index }];
  }), [result]);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const { camera } = useThree();
  const destination = useRef(new Vector3(0, 0, 6.2));
  const current = useRef(new Vector3(0, 0, 6.2));
  const temp = useRef(new Vector3());
  useEffect(() => {
    if (target) destination.current.copy(target.clone().normalize().multiplyScalar(5.2)).add(target.clone().normalize().multiplyScalar(0.7));
    else destination.current.set(0, 0, 6.2);
  }, [target, selectedId]);
  useFrame((_, delta) => {
    if (reducedMotion) return;
    current.current.lerp(destination.current, 1 - Math.exp(-delta * 1.4));
    camera.position.copy(current.current);
    camera.lookAt(ORIGIN);
  });
  return <>
    {markers.map(({ scenario, position, index }) => {
      const focused = selectedId === scenario.id;
      const severityColor = scenario.severity === "Critical" ? "#ff4545" : scenario.severity === "High" ? "#ffbf5b" : "#efc66c";
      return <mesh key={scenario.id} position={position} scale={focused ? MARKER_SCALE[scenario.severity] * 1.45 : MARKER_SCALE[scenario.severity]}
        onClick={(event) => { event.stopPropagation(); setTarget(position); onSelect(scenario.id); }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
        <octahedronGeometry args={[1, 1]} /><meshBasicMaterial color={severityColor} toneMapped={false} />
        <mesh scale={2.1}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color={severityColor} transparent opacity={focused ? 0.16 : 0.06} depthWrite={false} /></mesh>
      </mesh>;
    })}
  </>;
}

function SceneContents({ result, cursor, onSelect, selectedId, reducedMotion }: { result: Readonly<RunResult>; cursor: number; onSelect: (id: string) => void; selectedId: string | null; reducedMotion: boolean }) {
  const severityRatio = result.violations ? result.severeViolations / result.violations : 0;
  const timer = useRef(0);
  useFrame(({ camera }, delta) => {
    if (reducedMotion || selectedId) return;
    timer.current += delta;
    camera.position.x = Math.sin(timer.current * 0.075) * 0.15;
    camera.position.y = 0.08 + Math.sin(timer.current * 0.09) * 0.045;
    camera.lookAt(ORIGIN);
  });
  return <>
    <ambientLight intensity={0.16} />
    <directionalLight position={[4, 3, 5]} intensity={1.25} color="#a0fff4" />
    <CoreBody severityRatio={severityRatio} cursor={cursor} reducedMotion={reducedMotion} />
    <ParticleField result={result} cursor={cursor} reducedMotion={reducedMotion} />
    <FindingMarkers result={result} onSelect={onSelect} selectedId={selectedId} reducedMotion={reducedMotion} />
    {!reducedMotion && <EffectComposer multisampling={0}><Bloom intensity={0.54} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur /><Noise opacity={0.018} /><Vignette eskil={false} offset={0.2} darkness={0.66} /></EffectComposer>}
  </>;
}

function CanvasFailure() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const listener = (event: ErrorEvent) => { if (event.message.toLowerCase().includes("webgl")) setFailed(true); };
    window.addEventListener("error", listener);
    return () => window.removeEventListener("error", listener);
  }, []);
  return failed ? <span className="sr-only" role="status">WebGL unavailable; showing the accessible two-dimensional risk field.</span> : null;
}

export function RiskCoreScene({ result, cursor, onSelect, selectedId, reducedMotion }: { result: Readonly<RunResult>; cursor: number; onSelect: (id: string) => void; selectedId: string | null; reducedMotion: boolean }) {
  const falling = result.scenarios.filter((scenario) => !scenario.evaluation.passed);
  return <div className="panel-grid relative h-full min-h-[310px] overflow-hidden rounded-sm border border-line bg-[#0b1216]" aria-label="Risk Core scene. Violet indicators are not used. Red or amber markers represent evaluated synthetic rule findings.">
    <CanvasFailure />
    <div className="pointer-events-none absolute left-3 top-3 z-10"><p className="micro flex items-center gap-2 text-cyan"><span className="status-dot size-1.5 rounded-full bg-cyan" /> CONTAINED RISK CORE</p><p className="micro mt-1 text-muted">SYNTHETIC TEST-STREAM VISUALIZATION / NOT LIVE TELEMETRY</p></div>
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-mono text-muted"><span><i className="mr-1 inline-block size-1.5 rounded-full bg-cyan" />PASS / {result.passing}</span><span><i className="mr-1 inline-block size-1.5 rounded-full bg-alert" />VIOLATIONS / {result.violations}</span><span>EVENTS RESOLVED / {cursor} OF {result.events.length}</span></div>
    <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2"><span className="micro text-muted">RISK INTENSITY</span><span className="h-[2px] w-12" style={{ background: `linear-gradient(90deg, #37f0d0 ${Math.max(5, 100 - falling.length * 4)}%, #ff4545 100%)` }} /></div>
    <Canvas camera={{ position: [0, 0.12, 6.2], fov: 42 }} dpr={[1, 1.4]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true }} onCreated={({ gl }) => { gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4)); }} fallback={<div role="status" className="grid h-full min-h-[310px] place-items-center p-5 text-center"><div><div className="mx-auto size-32 rounded-full border border-alert/40 bg-alert/[.035] shadow-[0_0_40px_rgba(255,69,69,.1)]" /><p className="mt-4 micro text-muted">WEBGL UNAVAILABLE / 2D MODE</p></div></div>}>
      <SceneContents result={result} cursor={cursor} onSelect={onSelect} selectedId={selectedId} reducedMotion={reducedMotion} />
    </Canvas>
    <div className="absolute right-3 top-1/2 z-10 hidden max-h-[78%] w-[min(195px,35%)] -translate-y-1/2 overflow-y-auto border border-line bg-void/90 p-2.5 sm:block" aria-label="Accessible violation marker list">
      <p className="micro mb-2 flex items-center justify-between text-muted"><span>FINDING MARKERS</span><span>{falling.length}</span></p>
      <ul className="space-y-1">{falling.map((scenario) => <li key={scenario.id}><button onClick={() => onSelect(scenario.id)} aria-pressed={selectedId === scenario.id} className={`flex w-full items-start gap-2 border px-2 py-1.5 text-left transition-colors ${selectedId === scenario.id ? "border-alert/35 bg-alert/10" : "border-transparent hover:border-line"}`}><span className={`mt-0.5 size-1.5 shrink-0 rounded-full ${scenario.severity === "Critical" ? "bg-alert" : scenario.severity === "High" ? "bg-amber" : "bg-[#d7c772]"}`} /><span className="min-w-0"><span className="block truncate text-[9px] leading-relaxed text-ink">{scenario.name}</span><span className="micro mt-0.5 block text-muted">{scenario.caseId} · {scenario.severity}</span></span></button></li>)}</ul>
      {selectedId && <button onClick={() => onSelect("")} className="mt-2 w-full border border-line px-2 py-1.5 text-[8px] text-cyan hover:bg-cyan/[.05]">RETURN TO OVERVIEW</button>}
    </div>
  </div>;
}
