// SMS parsing is Android-only and not available on web
export function setOnNewTransaction(_cb: unknown) {}
export async function loadRecentSms(): Promise<never[]> { return []; }
export async function confirmTransaction(): Promise<void> {}
