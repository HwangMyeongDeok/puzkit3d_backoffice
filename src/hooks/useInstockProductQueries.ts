import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { managementProductApi } from "@/services/managementProductApi";
import type {
  // Instock DTOs
  GetInstockProductsParams,
  CreateInstockProductRequestDto,
  UpdateInstockProductRequestDto,
  CreateInstockProductVariantRequestDto,
  UpdateInstockProductVariantRequestDto,
  // Partner DTOs (Sếp check lại tên type xem đúng với file của sếp chưa nhé)
  GetPartnerProductsParams,
  CreatePartnerProductRequestDto,
  UpdatePartnerProductRequestDto,
  CreatePartnerProductVariantRequestDto,
  UpdatePartnerProductVariantRequestDto,
} from "@/types/types";

// ============================================================================
// 1. INSTOCK PRODUCTS & VARIANTS
// ============================================================================

// ─── INSTOCK QUERY KEYS ───
export const productKeys = {
  all: ["instock-products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,

  variants: () => [...productKeys.all, "variants"] as const,
  variantList: (productId: string) =>
    [...productKeys.variants(), productId] as const,
  variantDetail: (productId: string, variantId: string) =>
    [...productKeys.variantList(productId), variantId] as const,
};

// ─── INSTOCK PRODUCT HOOKS ───
export const useInstockProducts = (params: GetInstockProductsParams) => {
  return useQuery({
    // 2. Dùng lại JSON.stringify vì cái helper của ông bắt buộc nhận string
    queryKey: productKeys.list(JSON.stringify(params)), 
    
    queryFn: () => managementProductApi.getAllInstockProducts(params),

    // 3. Giữ data cũ khi đang load data mới (UX cực mượt)
    placeholderData: keepPreviousData, 

    // Đừng quên cái này để tránh gọi API liên tục
    staleTime: 60 * 1000, 
  });
};

export const useInstockProductById = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => managementProductApi.getInstockProductById(id),
    enabled: !!id,
  });
};

export const useCreateInstockProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstockProductRequestDto) =>
      managementProductApi.createInstockProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

export const useUpdateInstockProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInstockProductRequestDto;
    }) => managementProductApi.updateInstockProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// --- ĐÃ SỬA LẠI: CHUẨN DTO CỦA PRODUCT CHA ---
export const useToggleInstockProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        // Đang BẬT -> Gọi DELETE để tắt
        return managementProductApi.deactivateInstockProduct(id);
      } else {
        // Đang TẮT -> GET data cũ, nhặt đúng các trường DTO rồi PUT lên
        const currentData = await managementProductApi.getInstockProductById(id);
        
        // Map chuẩn xác theo UpdateInstockProductRequestDto
        const updatePayload: UpdateInstockProductRequestDto = {
          slug: currentData.slug,
          name: currentData.name,
          totalPieceCount: currentData.totalPieceCount,
          difficultLevel: currentData.difficultLevel,
          estimatedBuildTime: currentData.estimatedBuildTime,
          thumbnailUrl: currentData.thumbnailUrl,
          previewAsset: currentData.previewAsset,
          description: currentData.description || '',
          
          // Xử lý an toàn: Lấy ID từ object lồng nhau (nếu có) hoặc lấy trực tiếp
          topicId: (currentData as any).topic?.id || (currentData as any).topicId,
          assemblyMethodId: (currentData as any).assemblyMethod?.id || (currentData as any).assemblyMethodId,
          materialId: (currentData as any).material?.id || (currentData as any).materialId,
          
          // Capabilities thường là mảng object, cần map ra mảng string IDs
          capabilityIds: (currentData as any).capabilities?.map((c: any) => c.id) 
            || (currentData as any).capabilityIds 
            || [],

          isActive: true, // <--- Chốt hạ: Ép thành true để bật lại
        };

        return managementProductApi.updateInstockProduct(id, updatePayload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// ─── INSTOCK VARIANT HOOKS ───
export const useInstockProductVariants = (productId: string) => {
  return useQuery({
    queryKey: productKeys.variantList(productId),
    queryFn: () =>
      managementProductApi.getAllInstockProductVariantsByProductId(productId),
    enabled: !!productId,
  });
};

export const useCreateInstockProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateInstockProductVariantRequestDto;
    }) => managementProductApi.createInstockProductVariant(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.variantList(variables.productId),
      });
    },
  });
};

export const useUpdateInstockProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: string;
      variantId: string;
      data: UpdateInstockProductVariantRequestDto;
    }) =>
      managementProductApi.updateInstockProductVariant(
        productId,
        variantId,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.variantList(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.variantDetail(
          variables.productId,
          variables.variantId,
        ),
      });
    },
  });
};

// --- ĐÃ SỬA LẠI: DÙNG GET BY ID VÀ CHUẨN DTO MỚI ---
export const useToggleInstockProductVariantStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId, isActive }: { productId: string; variantId: string; isActive: boolean }) => {
      if (isActive) {
        return managementProductApi.deactivateInstockProductVariant(productId, variantId);
      } else {
        const currentVariant = await managementProductApi.getInstockProductVariantById(productId, variantId);

        // Chỉ bốc đúng 4 trường + isActive theo DTO ông dặn
        const updatePayload: UpdateInstockProductVariantRequestDto = {
          color: currentVariant.color,
          assembledLengthMm: currentVariant.assembledLengthMm,
          assembledWidthMm: currentVariant.assembledWidthMm,
          assembledHeightMm: currentVariant.assembledHeightMm,
          isActive: true, 
        };

        return managementProductApi.updateInstockProductVariant(productId, variantId, updatePayload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.variantList(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.variantDetail(variables.productId, variables.variantId) });
    },
  });
};

export const useDeleteInstockProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: string;
      variantId: string;
    }) =>
      managementProductApi.deactivateInstockProductVariant(productId, variantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.variantList(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
};

// ============================================================================
// 2. PARTNER PRODUCTS & VARIANTS
// ============================================================================

// ─── PARTNER QUERY KEYS ───
export const partnerProductKeys = {
  all: ["partner-products"] as const,
  lists: () => [...partnerProductKeys.all, "list"] as const,
  list: (filters: string) =>
    [...partnerProductKeys.lists(), { filters }] as const,
  details: () => [...partnerProductKeys.all, "detail"] as const,
  detail: (id: string) => [...partnerProductKeys.details(), id] as const,

  variants: () => [...partnerProductKeys.all, "variants"] as const,
  variantList: (productId: string) =>
    [...partnerProductKeys.variants(), productId] as const,
  variantDetail: (productId: string, variantId: string) =>
    [...partnerProductKeys.variantList(productId), variantId] as const,
};

// ─── PARTNER PRODUCT HOOKS ───
export const usePartnerProducts = (params: GetPartnerProductsParams) => {
  return useQuery({
    queryKey: partnerProductKeys.list(JSON.stringify(params)),
    queryFn: () => managementProductApi.getAllPartnerProducts(params),
  });
};

export const usePartnerProductById = (id: string) => {
  return useQuery({
    queryKey: partnerProductKeys.detail(id),
    queryFn: () => managementProductApi.getPartnerProductById(id),
    enabled: !!id,
  });
};

export const useCreatePartnerProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartnerProductRequestDto) =>
      managementProductApi.createPartnerProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerProductKeys.lists() });
    },
  });
};

export const useUpdatePartnerProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePartnerProductRequestDto;
    }) => managementProductApi.updatePartnerProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: partnerProductKeys.lists() });
    },
  });
};

export const useTogglePartnerProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive
        ? managementProductApi.deactivatePartnerProduct(id)
        : managementProductApi.activatePartnerProduct(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: partnerProductKeys.lists() });
    },
  });
};

// ─── PARTNER VARIANT HOOKS ───
export const usePartnerProductVariants = (productId: string) => {
  return useQuery({
    queryKey: partnerProductKeys.variantList(productId),
    queryFn: () =>
      managementProductApi.getAllPartnerProductVariantsByProductId(productId),
    enabled: !!productId,
  });
};

export const useCreatePartnerProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreatePartnerProductVariantRequestDto;
    }) => managementProductApi.createPartnerProductVariant(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.variantList(variables.productId),
      });
    },
  });
};

export const useUpdatePartnerProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: string;
      variantId: string;
      data: UpdatePartnerProductVariantRequestDto;
    }) =>
      managementProductApi.updatePartnerProductVariant(
        productId,
        variantId,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.variantList(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.variantDetail(
          variables.productId,
          variables.variantId,
        ),
      });
    },
  });
};

export const useTogglePartnerProductVariantStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      isActive,
    }: {
      productId: string;
      variantId: string;
      isActive: boolean;
    }) =>
      isActive
        ? managementProductApi.deactivatePartnerProductVariant(
            productId,
            variantId,
          )
        : managementProductApi.activatePartnerProductVariant(
            productId,
            variantId,
          ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partnerProductKeys.variantList(variables.productId),
      });
    },
  });
};
