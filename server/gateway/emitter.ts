import { createHmac, randomUUID } from 'node:crypto';
import { DIVISIONS_BY_ID } from '../contracts/canonical.ts';
import type { DivisionId, GatewayEventPayload } from '../domain/types.ts';

export type DocsMutationAction =
  | 'doc.created'
  | 'doc.updated'
  | 'doc.deleted'
  | 'rubric.created'
  | 'rubric.updated';

export interface GatewayEmitterConfig {
  gatewayUrl: string;
  gatewaySecret?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'warn'>;
}

export interface EmitEventInput {
  action: DocsMutationAction;
  divisionId: DivisionId;
  agentId: number;
  entityId: string;
  title: string;
  summary: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  metadata?: Record<string, unknown>;
}

export interface EmitResult {
  sent: boolean;
  statusCode?: number;
  payload: GatewayEventPayload;
  error?: string;
}

export function buildGatewayEventPayload(input: EmitEventInput): GatewayEventPayload {
  const division = DIVISIONS_BY_ID[input.divisionId];
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    source: 'docs',
    type: 'doc.updated',
    divisionId: input.divisionId,
    agentId: input.agentId,
    entityId: input.entityId.slice(0, 128),
    title: input.title.trim().slice(0, 160) || 'Documentation updated',
    summary: input.summary.trim().slice(0, 500) || 'Documentation Hub mutation',
    targetZone: division.defaultZone,
    targetFloor: division.defaultFloor,
    severity: input.severity,
    metadata: {
      action: input.action,
      ...input.metadata,
    },
  };
}

export async function emitGatewayEvent(
  config: GatewayEmitterConfig,
  input: EmitEventInput,
): Promise<EmitResult> {
  const payload = buildGatewayEventPayload(input);
  const baseUrl = config.gatewayUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/events`;
  const jsonBody = JSON.stringify(payload);
  const fetchFn = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 1500;
  const log = config.logger ?? console;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.gatewaySecret && config.gatewaySecret.length > 0) {
    const hmacHex = createHmac('sha256', config.gatewaySecret)
      .update(jsonBody)
      .digest('hex');
    headers.Authorization = `Bearer ${config.gatewaySecret}`;
    headers['x-lokatalenta-signature'] = `sha256=${hmacHex}`;
  }

  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers,
      body: jsonBody,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const msg = `Gateway returned HTTP ${response.status} for ${input.action} (${input.entityId})`;
      log.warn(`[lokatalenta-docs] ${msg}`);
      return { sent: false, statusCode: response.status, payload, error: msg };
    }

    return { sent: true, statusCode: response.status, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn(`[lokatalenta-docs] Gateway emit skipped (${input.action}): ${msg}`);
    return { sent: false, payload, error: msg };
  }
}
