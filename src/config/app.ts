export const APP_BASE_PATH = "/toeic-practice" as const;

export function publicAssetPath(path: `/${string}`): string {
  return `${APP_BASE_PATH}${path}`;
}
