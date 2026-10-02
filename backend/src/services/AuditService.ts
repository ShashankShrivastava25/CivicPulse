import { AuditLog } from '../models';

const SENSITIVE = /pass(word)?|token|secret|api[-_]?key|hash|authorization|cookie/i;

/** Removes anything that looks like a secret before it reaches the audit trail. */
export function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > 4) return value ?? null;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1);
    return out;
  }
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  return value;
}

export interface AuditInput {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** Audit writes must never break the user's request, so failures are logged and swallowed. */
export async function audit(input: AuditInput) {
  try {
    await AuditLog.create({ ...input, metadata: redact(input.metadata) });
  } catch (e) {
    console.error('Audit log write failed:', (e as Error).message);
  }
}
