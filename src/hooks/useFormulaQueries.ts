import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formulaApi } from "@/services/formulaApi";
import type { 
  UpdateFormulaPayload, 
  CreateValidationPayload, 
  UpdateValidationPayload, 
  CalculateFormulaPayload 
} from "@/services/formulaApi"; // Chỉnh lại đường dẫn import file type của bạn

// ==========================================
// SETUP QUERY KEYS
// ==========================================
export const formulaKeys = {
  all: ["formulas"] as const,
  lists: () => [...formulaKeys.all, "list"] as const,
  details: () => [...formulaKeys.all, "detail"] as const,
  detail: (id: string) => [...formulaKeys.details(), id] as const,
};

// ==========================================
// 1. HOOK: Lấy danh sách công thức
// ==========================================
export const useGetFormulas = () => {
  return useQuery({
    queryKey: formulaKeys.lists(),
    queryFn: () => formulaApi.getFormulas(),
  });
};

// ==========================================
// 2. HOOK: Lấy chi tiết 1 công thức
// ==========================================
export const useGetFormulaDetail = (id: string) => {
  return useQuery({
    queryKey: formulaKeys.detail(id),
    queryFn: () => formulaApi.getFormulaById(id),
    enabled: !!id, // Chỉ gọi API khi ID hợp lệ
  });
};

// ==========================================
// 3. HOOK: Update thông tin công thức
// ==========================================
export const useUpdateFormula = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateFormulaPayload) => 
      formulaApi.updateFormula(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulaKeys.detail(id) });
      toast.success("Đã cập nhật công thức thành công!");
    },
    onError: (error: any) => {
      console.error("Lỗi update formula:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật công thức. Vui lòng thử lại!"
      );
    },
  });
};

// ==========================================
// 4. HOOK: Create Validation
// ==========================================
export const useCreateFormulaValidation = (formulaId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateValidationPayload) => 
      formulaApi.createValidation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulaKeys.detail(formulaId) });
      toast.success("Đã thêm quy đổi kết quả thành công!");
    },
    onError: (error: any) => {
      console.error("Lỗi create validation:", error);
      toast.error(error.response?.data?.message || "Lỗi khi thêm quy đổi!");
    },
  });
};

// ==========================================
// 5. HOOK: Update Validation
// ==========================================
export const useUpdateFormulaValidation = (formulaId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ validationId, payload }: { validationId: string; payload: UpdateValidationPayload }) => 
      formulaApi.updateValidation(validationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulaKeys.detail(formulaId) });
      toast.success("Đã cập nhật quy đổi thành công!");
    },
    onError: (error: any) => {
      console.error("Lỗi update validation:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật quy đổi!");
    },
  });
};

// ==========================================
// 6. HOOK: Delete Validation
// ==========================================
export const useDeleteFormulaValidation = (formulaId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (validationId: string) => 
      formulaApi.deleteValidation(validationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulaKeys.detail(formulaId) });
      toast.success("Đã xóa quy đổi kết quả!");
    },
    onError: (error: any) => {
      console.error("Lỗi delete validation:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa quy đổi!");
    },
  });
};

// ==========================================
// 7. HOOK: Test Tính Toán (Calculate)
// ==========================================
export const useCalculateFormula = () => {
  return useMutation({
    mutationFn: ({ formulaCode, payload }: { formulaCode: string; payload: CalculateFormulaPayload }) => 
      formulaApi.calculate(formulaCode, payload),
    // Không cần Invalidate Queries vì API này không làm thay đổi Database
    onError: (error: any) => {
      console.error("Lỗi test tính toán:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tính toán thử!");
    },
  });
};