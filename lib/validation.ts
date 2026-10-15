import { z } from "zod";
import { GUARDRAIL_IDS } from "./policies";

export const ProfileIdSchema = z.enum(["skybridge", "meridian", "atlaspay"]);
export const GuardrailIdSchema = z.enum(GUARDRAIL_IDS as [typeof GUARDRAIL_IDS[number], ...typeof GUARDRAIL_IDS[number][]]);
export const RunRequestSchema = z.object({
  profileId: ProfileIdSchema,
  seed: z.number().int().min(0).max(2_147_483_647).optional(),
  volumeMultiplier: z.number().min(0.5).max(2).optional(),
  guardrails: z.array(GuardrailIdSchema).max(GUARDRAIL_IDS.length).optional(),
}).strict();
export const ReportRequestSchema = z.object({ runId: z.string().regex(/^LL-[A-F0-9]{8}$/) }).strict();
export const ApiErrorSchema = z.object({ error: z.string(), issues: z.array(z.string()).optional() }).strict();

export type RunRequest = z.infer<typeof RunRequestSchema>;
