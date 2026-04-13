import { axiosInstance } from '@/lib/axios';
// Định nghĩa kiểu cho Validation
export interface FormulaValueValidation {
  id: string;
  minValue: number;
  maxValue: number;
  output: string;
}

// Định nghĩa kiểu cho Formula
export interface Formula {
  id: string;
  code: string;
  expression: string;
  description: string;
  isNeedValidation: boolean;
  updatedAt: string;
  formulaValueValidations: FormulaValueValidation[];
}

// Payload khi cập nhật Formula
export interface UpdateFormulaPayload {
  expression?: string;
  description?: string;
}

// Payload khi tạo mới Validation
export interface CreateValidationPayload {
  formulaId: string; // Bắt buộc
  minValue: number;
  maxValue: number;
  output: string;
}

// Payload khi update Validation (các trường là optional)
export interface UpdateValidationPayload {
  minValue?: number;
  maxValue?: number;
  output?: string;
}

// Payload khi Test Tính toán (tất cả đều optional tùy công thức)
export interface CalculateFormulaPayload {
  capabilityId?: string;
  capabilityIds?: string[];
  materialId?: string;
  materialIds?: string[];
  topicId?: string;
  topicIds?: string[];
  assemblyMethodId?: string;
  assemblyMethodIds?: string[];
  pieceCount?: number;
}

// Kết quả trả về sau khi tính toán
export interface CalculateFormulaResponse {
  rawValue: number;
  validationOutput: string;
}
export const formulaApi = {
getFormulas: async () => {
    const { data } = await axiosInstance.get<Formula[]>("/formulas");
    return data;
  },

  getFormulaById: async (id: string) => {
    const { data } = await axiosInstance.get<Formula>(`/formulas/${id}`);
    return data;
  },

  updateFormula: async (id: string, payload: UpdateFormulaPayload) => {
    const { data } = await axiosInstance.put<string>(`/formulas/${id}`, payload);
    return data;
  },

  // ==========================================
  // VALIDATIONS
  // ==========================================
  createValidation: async (payload: CreateValidationPayload) => {
    const { data } = await axiosInstance.post<string>("/formula-value-validations", payload);
    return data;
  },

  updateValidation: async (id: string, payload: UpdateValidationPayload) => {
    const { data } = await axiosInstance.put(`/formula-value-validations/${id}`, payload);
    return data;
  },

  deleteValidation: async (id: string) => {
    const { data } = await axiosInstance.delete(`/formula-value-validations/${id}`);
    return data;
  },

  // ==========================================
  // CALCULATOR (TEST)
  // ==========================================
  calculate: async (formulaCode: string, payload: CalculateFormulaPayload) => {
    const { data } = await axiosInstance.post<CalculateFormulaResponse>(
      `/formulas/${formulaCode}/calculate`, 
      payload
    );
    return data;
  },
};