// import { axiosInstance } from "@/lib/axios";
// import type {
//   GetPartnerProductRequestsResponse,
//   PartnerProductRequestDetailDto,
//   UpdatePartnerProductRequestStatusRequest,
// } from "@/types/types";

// export async function getAllPartnerProductRequests(
//   pageNumber = 1,
//   pageSize = 8,
//   ascending = true,
//   searchTerm = "",
//   status?: number
// ) {
//   const response = await axiosInstance.get<GetPartnerProductRequestsResponse>(
//     "/partner-product-requests",
//     {
//       params: {
//         pageNumber,
//         pageSize,
//         ascending,
//         ...(searchTerm ? { searchTerm } : {}),
//         ...(typeof status === "number" ? { status } : {}),
//       },
//     }
//   );

//   return response.data;
// }

// export async function getStaffPartnerProductRequests(
//   pageNumber = 1,
//   pageSize = 8
// ) {
//   const response = await axiosInstance.get<GetPartnerProductRequestsResponse>(
//     "/partner-product-requests/staff/requests",
//     {
//       params: { pageNumber, pageSize },
//     }
//   );

//   return response.data;
// }

// export async function getManagerPartnerProductRequests(
//   pageNumber = 1,
//   pageSize = 8,
//   searchTerm = ""
// ) {
//   const response = await axiosInstance.get<GetPartnerProductRequestsResponse>(
//     "/partner-product-requests/manager/requests",
//     {
//       params: {
//         pageNumber,
//         pageSize,
//         ...(searchTerm ? { searchTerm } : {}),
//       },
//     }
//   );

//   return response.data;
// }

// export async function getPartnerProductRequestDetail(id: string) {
//   const response = await axiosInstance.get<PartnerProductRequestDetailDto>(
//     `/partner-product-requests/${id}/detail`
//   );
//   return response.data;
// }

// export async function updatePartnerProductRequestStatus(
//   id: string,
//   payload: UpdatePartnerProductRequestStatusRequest
// ) {
//   const response = await axiosInstance.put(
//     `/partner-product-requests/${id}/status`,
//     payload
//   );
//   return response.data;
// }
import { axiosInstance } from "@/lib/axios";
import type {
  GetPartnerProductRequestsResponse,
  PartnerProductRequestDetailDto,
  UpdatePartnerProductRequestStatusRequest,
} from "@/types/types";

export async function getPartnerProductRequests(
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  status?: number,
  ascending = true
) {
  const response = await axiosInstance.get<GetPartnerProductRequestsResponse>(
    "/partner-product-requests",
    {
      params: {
        pageNumber,
        pageSize,
        ascending,
        ...(searchTerm ? { searchTerm } : {}),
        ...(typeof status === "number" ? { status } : {}),
      },
    }
  );

  return response.data;
}

export async function getPartnerProductRequestDetail(id: string) {
  const response = await axiosInstance.get<PartnerProductRequestDetailDto>(
    `/partner-product-requests/${id}/detail`
  );
  return response.data;
}

export async function updatePartnerProductRequestStatus(
  id: string,
  payload: UpdatePartnerProductRequestStatusRequest
) {
  const response = await axiosInstance.put(
    `/partner-product-requests/${id}/status`,
    payload
  );
  return response.data;
}