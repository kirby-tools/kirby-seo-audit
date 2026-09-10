import { hash } from "ohash";
import { STORAGE_KEY_PREFIX } from "../constants";

export function readStoredReport(scope) {
  const value = localStorage.getItem(getReportStorageKey(scope));
  return value ? JSON.parse(value) : undefined;
}

export function writeStoredReport(scope, report) {
  localStorage.setItem(getReportStorageKey(scope), JSON.stringify(report));
}

function getReportStorageKey({ path, language, section }) {
  return `${STORAGE_KEY_PREFIX}${hash([path, language, section])}`;
}
