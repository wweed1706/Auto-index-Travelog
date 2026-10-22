import { useEffect, useState } from 'react';

export type HealthState = 'not-configured' | 'checking' | 'online' | 'offline';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export function useApiHealth(): HealthState {
  const [status, setStatus] = useState<HealthState>(API_URL ? 'checking' : 'not-configured');

  useEffect(() => {
    if (!API_URL) {
      return;
    }

    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 5000);

    async function checkHealth() {
      try {
        const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
        const body: { status?: string } = await response.json();
        if (active) {
          setStatus(response.ok && body.status === 'ok' ? 'online' : 'offline');
        }
      } catch {
        if (active) {
          setStatus('offline');
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    void checkHealth();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return status;
}
