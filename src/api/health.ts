import axios from 'axios';

import { BFF_URL } from '@/api/client';
import type { HealthStatus } from '@/types/domain';

/**
 * Lightweight health check for the TruePas dev backend.
 * Uses a bare `axios.get` (no auth header, short timeout) so it works
 * even before the user is logged in.
 *
 * The app calls only the BFF; liveness/face services are behind the BFF.
 */

const HEALTH_TIMEOUT = 8_000;

export async function checkBffHealth(): Promise<HealthStatus> {
  try {
    const { data } = await axios.get<{ status?: string; service?: string; version?: string }>(
      `${BFF_URL}/health`,
      { timeout: HEALTH_TIMEOUT }
    );
    return {
      healthy: data.status === 'healthy' || data.status === 'ok',
      service: data.service,
      version: data.version,
    };
  } catch {
    return { healthy: false };
  }
}

/** Check BFF health. Liveness is behind the BFF so a single check suffices. */
export async function checkAllHealth(): Promise<{
  bff: HealthStatus;
}> {
  const bff = await checkBffHealth();
  return { bff };
}
