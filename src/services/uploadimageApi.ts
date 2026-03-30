import axios from "axios";
import { axiosInstance } from "@/lib/axios";

interface PresignedUrlRequestDto {
  contentType: string;
  folder: string;
  path: string;
  fileName: string;
}

interface PresignedUrlResponseDto {
  presignedUrl: string;
  path: string;
}

export type UploadImageResult = {
  url: string;
  path: string;
  fileName: string;
  contentType: string;
  presignedUrl: string;
};

function getFileExtension(file: File) {
  const originalExt = file.name.split(".").pop()?.trim().toLowerCase();
  if (originalExt) return originalExt;

  const mimeToExtMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };

  return mimeToExtMap[file.type] || "jpg";
}

function normalizeFileName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

async function requestPresignedUrl(
  file: File,
  folder: string,
  customPathString: string
): Promise<PresignedUrlResponseDto> {
  const extension = getFileExtension(file);
  const safeFileName = normalizeFileName(file.name || `image.${extension}`);

  const normalizedPath = customPathString.endsWith(`.${extension}`)
    ? customPathString
    : `${customPathString}.${extension}`;

  const requestBody: PresignedUrlRequestDto = {
    contentType: file.type || "application/octet-stream",
    folder,
    path: normalizedPath,
    fileName: safeFileName,
  };

  const { data } = await axiosInstance.post<PresignedUrlResponseDto>(
    "/uploads/presigned-url",
    requestBody
  );

  if (!data?.presignedUrl) {
    throw new Error("Backend không trả về presignedUrl.");
  }

  if (!data?.path) {
    throw new Error("Backend không trả về path.");
  }

  return data;
}

async function putFileToS3(presignedUrl: string, file: File) {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
}

export const uploadImageApi = {
  uploadSingleImage: async (
    file: File,
    folder: string,
    customPathString: string
  ): Promise<UploadImageResult> => {
    const { presignedUrl, path } = await requestPresignedUrl(
      file,
      folder,
      customPathString
    );

    await putFileToS3(presignedUrl, file);

    return {
      url: path,
      path,
      fileName: file.name,
      contentType: file.type,
      presignedUrl,
    };
  },
};