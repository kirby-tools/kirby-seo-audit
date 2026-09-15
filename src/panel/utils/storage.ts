import type { Report, ReportStorageScope } from "../types";
import { hash } from "ohash";
import { STORAGE_KEY_PREFIX } from "../constants";

export function readStoredReport(
  scope: ReportStorageScope,
): Report | undefined {
  const value = localStorage.getItem(getReportStorageKey(scope));
  return value ? JSON.parse(value) : undefined;
}

export function writeStoredReport(scope: ReportStorageScope, report: Report) {
  localStorage.setItem(getReportStorageKey(scope), JSON.stringify(report));
}

function getReportStorageKey({ path, language, section }: ReportStorageScope) {
  return `${STORAGE_KEY_PREFIX}${hash([path, language, section])}`;
}
