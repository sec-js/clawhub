import type { Value } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type BaseArtifactModerationEventInput = {
  kind: "report" | "appeal";
  actorUserId: Id<"users">;
  action: string;
  timelineMetadata?: Value;
  auditAction: string;
  auditTargetType: string;
  auditTargetId: string;
  auditMetadata?: Value;
  createdAt: number;
};

type SkillModerationEventInput = BaseArtifactModerationEventInput & {
  reportId?: Id<"skillReports">;
  appealId?: Id<"skillAppeals">;
};

type PackageModerationEventInput = BaseArtifactModerationEventInput & {
  reportId?: Id<"packageReports">;
  appealId?: Id<"packageAppeals">;
};

export async function recordSkillModerationEvent(
  ctx: MutationCtx,
  event: SkillModerationEventInput,
) {
  await ctx.db.insert("skillModerationEvents", {
    kind: event.kind,
    ...(event.reportId ? { reportId: event.reportId } : {}),
    ...(event.appealId ? { appealId: event.appealId } : {}),
    actorUserId: event.actorUserId,
    action: event.action,
    ...(event.timelineMetadata ? { metadata: event.timelineMetadata } : {}),
    createdAt: event.createdAt,
  });
  await ctx.db.insert("auditLogs", {
    actorUserId: event.actorUserId,
    action: event.auditAction,
    targetType: event.auditTargetType,
    targetId: event.auditTargetId,
    ...(event.auditMetadata ? { metadata: event.auditMetadata } : {}),
    createdAt: event.createdAt,
  });
}

export async function recordPackageModerationEvent(
  ctx: MutationCtx,
  event: PackageModerationEventInput,
) {
  await ctx.db.insert("packageModerationEvents", {
    kind: event.kind,
    ...(event.reportId ? { reportId: event.reportId } : {}),
    ...(event.appealId ? { appealId: event.appealId } : {}),
    actorUserId: event.actorUserId,
    action: event.action,
    ...(event.timelineMetadata ? { metadata: event.timelineMetadata } : {}),
    createdAt: event.createdAt,
  });
  await ctx.db.insert("auditLogs", {
    actorUserId: event.actorUserId,
    action: event.auditAction,
    targetType: event.auditTargetType,
    targetId: event.auditTargetId,
    ...(event.auditMetadata ? { metadata: event.auditMetadata } : {}),
    createdAt: event.createdAt,
  });
}
