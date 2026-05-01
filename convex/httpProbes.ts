import { httpAction } from "./functions";

export type ProbeName = "healthz" | "readyz";

export type ProbePayload = {
  ok: true;
  status: "ok";
  service: "clawhub";
  probe: ProbeName;
  timestamp: string;
  build: {
    sha: string | null;
    deployedAt: string | null;
  };
};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function normalizeEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildProbePayload(probe: ProbeName, now = new Date()): ProbePayload {
  return {
    ok: true,
    status: "ok",
    service: "clawhub",
    probe,
    timestamp: now.toISOString(),
    build: {
      sha: normalizeEnv(process.env.APP_BUILD_SHA),
      deployedAt: normalizeEnv(process.env.APP_DEPLOYED_AT),
    },
  };
}

export function buildProbeResponse(probe: ProbeName, method = "GET", now = new Date()) {
  return new Response(
    method.toUpperCase() === "HEAD" ? null : JSON.stringify(buildProbePayload(probe, now)),
    {
      status: 200,
      headers: JSON_HEADERS,
    },
  );
}

export const healthzHttp = httpAction(async (_ctx, request) =>
  buildProbeResponse("healthz", request.method),
);

export const readyzHttp = httpAction(async (_ctx, request) =>
  buildProbeResponse("readyz", request.method),
);
