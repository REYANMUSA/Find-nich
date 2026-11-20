let posthogPromise: Promise<any> | null = null;
let initialized = false;

function getPosthogConfig() {
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (token && host) {
    return { token, host };
  }
  return null;
}

export function initAnalyticsDeferred(): void {
  const config = getPosthogConfig();
  if (!config || initialized) return;

  const start = () => {
    getPosthogInstance();
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(start, { timeout: 2500 });
  } else {
    setTimeout(start, 800);
  }
}

async function getPosthogInstance(): Promise<any | null> {
  const config = getPosthogConfig();
  if (!config) return null;

  if (!posthogPromise) {
    posthogPromise = import('posthog-js').then((mod) => {
      const ph = mod.default;
      if (!initialized) {
        ph.init(config.token, {
          api_host: config.host,
          defaults: '2026-08-30',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
        });
        initialized = true;
      }
      return ph;
    }).catch(() => null);
  }
  return posthogPromise;
}

export function captureEvent(event: string, properties?: Record<string, any>): void {
  if (!getPosthogConfig()) return;
  getPosthogInstance().then((ph) => {
    if (ph && typeof ph.capture === 'function') {
      ph.capture(event, properties);
    }
  });
}
