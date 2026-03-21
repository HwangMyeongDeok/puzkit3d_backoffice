import { axiosInstance } from "@/lib/axios";
import type {
  GetInstockProductsParams,
  PagedResult,
  InstockProductDto,
  CreateInstockProductRequestDto,
  UpdateInstockProductRequestDto,
  InstockProductVariantDto,
  CreateInstockProductVariantRequestDto,
  UpdateInstockProductVariantRequestDto,
  GetPartnerProductsParams,
  PartnerProductDto,
  CreatePartnerProductRequestDto,
  UpdatePartnerProductRequestDto,
  PartnerProductVariantDto,
  CreatePartnerProductVariantRequestDto,
  UpdatePartnerProductVariantRequestDto,
} from "@/types/types";

export const managementProductApi = {
  // GET /api/instock-products
  getAllInstockProducts: async (
    params: GetInstockProductsParams,
  ): Promise<PagedResult<InstockProductDto>> => {
    // Construct query string
    const query = new URLSearchParams();
    query.append("pageNumber", params.pageNumber.toString());
    query.append("pageSize", params.pageSize.toString());
    if (params.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params.isActive !== undefined)
      query.append("isActive", params.isActive.toString());

    const response = await axiosInstance.get<PagedResult<InstockProductDto>>(
      `/instock-products?${query.toString()}`,
    );
    return response.data;
  },

  // GET /api/instock-products/{id}
  getInstockProductById: async (id: string): Promise<InstockProductDto> => {
    const response = await axiosInstance.get<InstockProductDto>(
      `/instock-products/${id}`,
    );
    return response.data;
  },

  // POST /api/instock-products
  createInstockProduct: async (
    data: CreateInstockProductRequestDto,
  ): Promise<string> => {
    const response = await axiosInstance.post<string>("/instock-products", data);
    return response.data;
  },

  // PUT /api/instock-products/{id}
  updateInstockProduct: async (
    id: string,
    data: UpdateInstockProductRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(`/instock-products/${id}`, data);
    return response.data;
  },

  // DELETE /api/instock-products/{id}
  deactivateInstockProduct: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(`/instock-products/${id}`);
    return response.data;
  },

  // GET /api/instock-products/{productId}/variants
  getAllInstockProductVariantsByProductId: async (
    productId: string,
  ): Promise<InstockProductVariantDto[]> => {
    const response = await axiosInstance.get<{
      variants: InstockProductVariantDto[];
    }>(`/instock-products/${productId}/variants`);
    return response.data.variants;
  },

  // GET /api/instock-products/{productId}/variants/{variantId}
  getInstockProductVariantById: async (
    productId: string,
    variantId: string,
  ): Promise<InstockProductVariantDto> => {
    const response = await axiosInstance.get<InstockProductVariantDto>(
      `/instock-products/${productId}/variants/${variantId}`,
    );
    return response.data;
  },

  // POST /api/instock-products/{productId}/variants
  createInstockProductVariant: async (
    productId: string,
    data: CreateInstockProductVariantRequestDto,
  ): Promise<string> => {
    // returns created uuid
    const response = await axiosInstance.post(
      `/instock-products/${productId}/variants`,
      data,
    );
    return response.data;
  },

  // PUT /api/instock-products/{productId}/variants/{variantId}
  updateInstockProductVariant: async (
    productId: string,
    variantId: string,
    data: UpdateInstockProductVariantRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(
      `/instock-products/${productId}/variants/${variantId}`,
      data,
    );
    return response.data;
  },

  // DELETE /api/instock-products/{productId}/variants/{variantId}
  deactivateInstockProductVariant: async (
    productId: string,
    variantId: string,
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/instock-products/${productId}/variants/${variantId}`,
    );
    return response.data;
  },

  // ─── PARTNER PRODUCTS ───

  // GET /api/partner-products
  getAllPartnerProducts: async (
    params: GetPartnerProductsParams,
  ): Promise<PagedResult<PartnerProductDto>> => {
    const query = new URLSearchParams();
    query.append("pageNumber", params.pageNumber.toString());
    query.append("pageSize", params.pageSize.toString());
    if (params.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params.isActive !== undefined)
      query.append("isActive", params.isActive.toString());

    const response = await axiosInstance.get<PagedResult<PartnerProductDto>>(
      `/partner-products?${query.toString()}`,
    );
    return response.data;
  },

  // GET /api/partner-products/{id}
  getPartnerProductById: async (id: string): Promise<PartnerProductDto> => {
    const response = await axiosInstance.get<PartnerProductDto>(
      `/partner-products/${id}`,
    );
    return response.data;
  },

  // POST /api/partner-products
  createPartnerProduct: async (
    data: CreatePartnerProductRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.post("/partner-products", data);
    return response.data;
  },

  // PUT /api/partner-products/{id}
  updatePartnerProduct: async (
    id: string,
    data: UpdatePartnerProductRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(`/partner-products/${id}`, data);
    return response.data;
  },

  // PATCH /api/partner-products/{id}/activate
  activatePartnerProduct: async (id: string): Promise<void> => {
    const response = await axiosInstance.patch(
      `/partner-products/${id}/activate`,
    );
    return response.data;
  },

  // DELETE /api/partner-products/{id}
  deactivatePartnerProduct: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(`/partner-products/${id}`);
    return response.data;
  },

  // ─── PARTNER PRODUCT VARIANTS ───

  // GET /api/partner-products/{productId}/variants
  getAllPartnerProductVariantsByProductId: async (
    productId: string,
  ): Promise<PartnerProductVariantDto[]> => {
    const response = await axiosInstance.get<PartnerProductVariantDto[]>(
      `/partner-products/${productId}/variants`,
    );
    return response.data;
  },

  // POST /api/partner-products/{productId}/variants
  createPartnerProductVariant: async (
    productId: string,
    data: CreatePartnerProductVariantRequestDto,
  ): Promise<string> => {
    const response = await axiosInstance.post(
      `/partner-products/${productId}/variants`,
      data,
    );
    return response.data;
  },

  // PUT /api/partner-products/{productId}/variants/{variantId}
  updatePartnerProductVariant: async (
    productId: string,
    variantId: string,
    data: UpdatePartnerProductVariantRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(
      `/partner-products/${productId}/variants/${variantId}`,
      data,
    );
    return response.data;
  },

  // PATCH /api/partner-products/{productId}/variants/{variantId}/activate
  activatePartnerProductVariant: async (
    productId: string,
    variantId: string,
  ): Promise<void> => {
    const response = await axiosInstance.patch(
      `/partner-products/${productId}/variants/${variantId}/activate`,
    );
    return response.data;
  },

  // DELETE /api/partner-products/{productId}/variants/{variantId}
  deactivatePartnerProductVariant: async (
    productId: string,
    variantId: string,
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/partner-products/${productId}/variants/${variantId}`,
    );
    return response.data;
  },
};
