import { createFileRoute } from "@tanstack/react-router";
import { buildProbeResponse } from "../lib/probes";

export const Route = createFileRoute("/readyz")({
  server: {
    handlers: {
      GET: ({ request }) => buildProbeResponse("readyz", request.method),
      HEAD: ({ request }) => buildProbeResponse("readyz", request.method),
    },
  },
});
