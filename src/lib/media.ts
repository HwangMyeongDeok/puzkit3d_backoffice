const PUBLIC_FILE_BASE_URL = (
  import.meta.env.VITE_S3_PUBLIC_BASE_URL || ""
).replace(/\/+$/, "");

export function resolveAssetUrl(value?: string | null) {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:\/\/|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (!PUBLIC_FILE_BASE_URL) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  return `${PUBLIC_FILE_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
}