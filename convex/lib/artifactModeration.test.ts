/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  type ArtifactAppealStatus,
  type ArtifactReportStatus,
  assertArtifactAppealFinalAction,
  assertArtifactAppealTransition,
  assertArtifactReportFinalAction,
  assertArtifactReportTransition,
} from "./artifactModeration";

describe("artifact moderation state graph", () => {
  it.each([
    ["open", "triaged"],
    ["open", "dismissed"],
    ["triaged", "open"],
    ["dismissed", "open"],
    [undefined, "triaged"],
    [undefined, "dismissed"],
  ] satisfies Array<[ArtifactReportStatus | undefined, ArtifactReportStatus]>)(
    "allows report transition %s -> %s",
    (from, to) => {
      expect(() => assertArtifactReportTransition(from, to)).not.toThrow();
    },
  );

  it.each([
    ["open", "open"],
    ["triaged", "triaged"],
    ["dismissed", "dismissed"],
    ["triaged", "dismissed"],
    ["dismissed", "triaged"],
    [undefined, "open"],
  ] satisfies Array<[ArtifactReportStatus | undefined, ArtifactReportStatus]>)(
    "blocks report transition %s -> %s",
    (from, to) => {
      expect(() => assertArtifactReportTransition(from, to)).toThrow(
        "Invalid report status transition",
      );
    },
  );

  it.each([
    ["triaged", "hide"],
    ["triaged", "quarantine"],
    ["triaged", "revoke"],
    ["open", "none"],
    ["triaged", "none"],
    ["dismissed", "none"],
  ] satisfies Array<[ArtifactReportStatus, "none" | "hide" | "quarantine" | "revoke"]>)(
    "allows report final action %s + %s",
    (status, action) => {
      expect(() =>
        assertArtifactReportFinalAction(status, action, ["hide", "quarantine", "revoke"]),
      ).not.toThrow();
    },
  );

  it.each([
    ["open", "hide", "Reopened reports cannot apply a final action."],
    ["dismissed", "hide", "Dismissed reports cannot apply a final action."],
    ["triaged", "restore", "Unsupported report final action: restore."],
  ] satisfies Array<[ArtifactReportStatus, "hide" | "restore", string]>)(
    "blocks report final action %s + %s",
    (status, action, message) => {
      expect(() =>
        assertArtifactReportFinalAction(status, action, ["hide", "quarantine", "revoke"]),
      ).toThrow(message);
    },
  );

  it.each([
    ["open", "accepted"],
    ["open", "rejected"],
    ["accepted", "open"],
    ["rejected", "open"],
    [undefined, "accepted"],
    [undefined, "rejected"],
  ] satisfies Array<[ArtifactAppealStatus | undefined, ArtifactAppealStatus]>)(
    "allows appeal transition %s -> %s",
    (from, to) => {
      expect(() => assertArtifactAppealTransition(from, to)).not.toThrow();
    },
  );

  it.each([
    ["open", "open"],
    ["accepted", "accepted"],
    ["rejected", "rejected"],
    ["accepted", "rejected"],
    ["rejected", "accepted"],
    [undefined, "open"],
  ] satisfies Array<[ArtifactAppealStatus | undefined, ArtifactAppealStatus]>)(
    "blocks appeal transition %s -> %s",
    (from, to) => {
      expect(() => assertArtifactAppealTransition(from, to)).toThrow(
        "Invalid appeal status transition",
      );
    },
  );

  it.each([
    ["accepted", "restore"],
    ["accepted", "approve"],
    ["open", "none"],
    ["accepted", "none"],
    ["rejected", "none"],
  ] satisfies Array<[ArtifactAppealStatus, "none" | "restore" | "approve"]>)(
    "allows appeal final action %s + %s",
    (status, action) => {
      expect(() =>
        assertArtifactAppealFinalAction(status, action, ["restore", "approve"]),
      ).not.toThrow();
    },
  );

  it.each([
    ["open", "restore", "Reopened appeals cannot apply a final action."],
    ["rejected", "restore", "Rejected appeals cannot apply a final action."],
    ["accepted", "hide", "Unsupported appeal final action: hide."],
  ] satisfies Array<[ArtifactAppealStatus, "restore" | "hide", string]>)(
    "blocks appeal final action %s + %s",
    (status, action, message) => {
      expect(() => assertArtifactAppealFinalAction(status, action, ["restore", "approve"])).toThrow(
        message,
      );
    },
  );
});
