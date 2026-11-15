const healthUrl = process.env.HEALTH_URL;

if (!healthUrl) {
  throw new Error('HEALTH_URL environment variable must be set');
}

const response = await fetch(healthUrl, { signal: AbortSignal.timeout(20_000) });

if (!response.ok) {
  throw new Error(`Health request failed with HTTP ${response.status}`);
}

console.log(`Health check succeeded: ${healthUrl}`);
