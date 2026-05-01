import { createFileRoute } from "@tanstack/react-router";
import { buildProbeResponse } from "../lib/probes";

export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: ({ request }) => buildProbeResponse("healthz", request.method),
      HEAD: ({ request }) => buildProbeResponse("healthz", request.method),
    },
  },
});
