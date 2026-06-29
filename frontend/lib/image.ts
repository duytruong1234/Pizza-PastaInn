export function shouldBypassNextImageOptimization(src?: string | null) {
  if (!src) return false;

  try {
    return new URL(src).pathname.startsWith('/uploads/');
  } catch {
    return src.startsWith('/uploads/') || src.includes('/uploads/');
  }
}
