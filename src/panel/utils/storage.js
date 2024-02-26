import { hash } from "ohash";
import { STORAGE_KEY_PREFIX } from "../constants";

export function getHashedStorageKey(...args) {
  return `${STORAGE_KEY_PREFIX}${hash([...args])}`;
}
