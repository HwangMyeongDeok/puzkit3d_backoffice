import axios from 'axios';
import { axiosInstance } from '@/lib/axios';

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

export const uploadApi = {
  uploadFileToS3: async (
    file: File,
    folder: string,
    customPathString: string
  ): Promise<string> => {
    const { data } = await axiosInstance.post<PresignedUrlResponseDto>(
      '/uploads/presigned-url',
      {
        contentType: file.type,
        folder,
        path: customPathString,
        fileName: file.name,
      } as PresignedUrlRequestDto
    );

    const { presignedUrl, path } = data;

    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });

    return path;
  },
};