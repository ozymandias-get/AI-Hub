/** Shared process-wide flags (main process only). */
let isQuitting = false;

export function setQuitting(value: boolean): void {
  isQuitting = value;
}

export function getIsQuitting(): boolean {
  return isQuitting;
}
