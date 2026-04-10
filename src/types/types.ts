export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// 2. Catalog (CamelCase only)
export interface CatalogItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

export type AssemblyMethod = CatalogItem;
export type Material = CatalogItem;
export type Capability = CatalogItem;

// 3. Products (Matching API JSON)
export type DifficultLevel = "Basic" | "Intermediate" | "Advanced";
export type PartType = 'Structural' | 'Mechanical' | 'Decorative';

export interface Part {
  id: string;
  name: string;
  partType: PartType;
  code: string; // Auto-generated (PARxxxx)
  quantity: number;
}

export interface PartRequest {
  name: string;
  partType: PartType;
  quantity: number;
}
// Instock DTOs
export interface GetInstockProductsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface InstockPriceDetail {
  id: string;
  variantId: string;
  price: number;
  priority: number;
  isActive: boolean;
}

export interface InstockProductDto {
  id: string;
  code: string;
  slug: string;
  name: string;
  totalPieceCount: number;
  difficultLevel: DifficultLevel;
  estimatedBuildTime: number;
  thumbnailUrl: string;
  previewAsset: string[];
  description: string | null;
  topicId: string;
  materialId: string;
  assemblyMethodId: string;
  capabilityIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── INSTOCK PRICE TYPES ───

export interface InstockPriceDto {
  id: string;
  name: string;
  effectiveFrom: string | null; // ISO Date string
  effectiveTo: string | null;   // ISO Date string
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Params để gọi API GET list
export interface InstockPriceQueryConfig {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}



// Request Body cho Create (POST)
export interface CreateInstockPriceRequestDto {
  name: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  priority: number;
  isActive: boolean;
}

// Request Body cho Update (PUT)
export interface UpdateInstockPriceRequestDto {
  name?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  priority?: number;
  isActive?: boolean;
}

export interface CreateInstockProductRequestDto {
  slug: string;
  name: string;
  totalPieceCount: number;
  difficultLevel: DifficultLevel;
  estimatedBuildTime: number;
  thumbnailUrl: string;
  previewAsset: Record<string, any>;
  topicId: string;
  assemblyMethodId: string;
  capabilityIds: string[];
  materialId: string;
  description: string;
  isActive: boolean;
}

export interface UpdateInstockProductRequestDto {
  slug?: string;
  name?: string;
  totalPieceCount?: number;
  difficultLevel?: DifficultLevel;
  estimatedBuildTime?: number;
  thumbnailUrl?: string;
  previewAsset?: Record<string, any>;
  topicId?: string;
  assemblyMethodId?: string;
  capabilityIds?: string[];
  materialId?: string;
  description?: string;
  isActive?: boolean;
}
// ─── INSTOCK PRICE DETAIL TYPES ───

export interface InstockPriceDetailDto {
  id: string;
  priceId: string;
  variantId: string;
  unitPrice: number;
  priceName: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstockPriceDetailRequestDto {
  priceId: string;
  variantId: string;
  unitPrice: number; // Yêu cầu >= 10,000
  isActive: boolean;
}

export interface UpdateInstockPriceDetailRequestDto {
  unitPrice?: number;
  isActive?: boolean;
}

// Partner DTOs
export interface GetPartnerProductsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isActive?: boolean;
}

// export interface PartnerProductDto extends Omit<
//   InstockProductDto,
//   "capabilityIds"
// > {
//   capabilityId: string;
// }

export interface CreatePartnerProductRequestDto {
  slug: string;
  name: string;
  totalPieceCount: number;
  difficultLevel: DifficultLevel;
  estimatedBuildTime: number;
  thumbnailUrl: string;
  previewAsset: Record<string, string>;
  topicId: string;
  assemblyMethodId: string;
  capabilityId: string;
  materialId: string;
  description: string;
  isActive: boolean;
}

export interface UpdatePartnerProductRequestDto {
  slug?: string;
  name?: string;
  totalPieceCount?: number;
  difficultLevel?: DifficultLevel;
  estimatedBuildTime?: number;
  thumbnailUrl?: string;
  previewAsset?: Record<string, string>;
  topicId?: string;
  assemblyMethodId?: string;
  capabilityId?: string;
  materialId?: string;
  description?: string;
  isActive?: boolean;
}

// 4. Variants & Others
export interface InstockProductVariantDto {
  id: string;
  instockProductId: string;
  sku: string;
  color: string;
  assembledLengthMm: number;
  assembledWidthMm: number;
  assembledHeightMm: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInstockProductVariantRequestDto {
  color: string;
  assembledLengthMm: number;
  assembledWidthMm: number;
  assembledHeightMm: number;
  isActive: boolean;
}

export interface UpdateInstockProductVariantRequestDto {
  color?: string;
  assembledLengthMm?: number;
  assembledWidthMm?: number;
  assembledHeightMm?: number;
  isActive?: boolean;
}

export interface PartnerProductVariantDto {
  id: string;
  partnerProductId: string;
  sku: string;
  color: string;
  size: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerProductVariantRequestDto {
  color: string;
  size: string;
  isActive: boolean;
}

export interface UpdatePartnerProductVariantRequestDto {
  color?: string;
  size?: string;
  isActive?: boolean;
}

// Order DTOs
export type InstockOrderStatus =
  | 'Pending'
  | 'Paid'
  | 'Waiting'
  | 'PickedUp'
  | 'Delivering'
  | 'Delivered'
  | 'Processing'
  | 'HandedOverToDelivery'
  | 'ReadyToPick'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Returned'
  | 'Expired';

export interface GetCustomerOrdersParams {
  pageNumber: number;
  pageSize: number;
  status?: InstockOrderStatus;
}

export interface InstockOrderDetailPreviewDto {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  thumbnailUrl: string;
}

export interface InstockCustomerOrderListItemDto {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  grandTotalAmount: number;
  totalQuantity: number;
  status: InstockOrderStatus;
  paymentMethod: string;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  orderDetailsPreview: InstockOrderDetailPreviewDto[];
}

export interface InstockOrderProductDetailsDto {
  productId: string;
  code: string;
  name: string;
  description: string;
  difficultLevel: string;
  estimatedBuildTime: number;
  totalPieceCount: number;
  thumbnailUrl: string;
  previewAsset: string[];
  isActive: boolean;
}

export interface InstockOrderVariantDetailsDto {
  color: string;
  assembledLengthMm: number;
  assembledWidthMm: number;
  assembledHeightMm: number;
  isActive: boolean;
}

export interface InstockOrderDetailDto {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  priceName: string;
  thumbnailUrl: string;
  productDetails: InstockOrderProductDetailsDto;
  variantDetails: InstockOrderVariantDetailsDto;
}

export interface InstockCustomerOrderDto {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerProvinceName: string;
  customerDistrictName: string;
  customerWardName: string;
  detailAddress: string;
  subTotalAmount: number;
  shippingFee: number;
  usedCoinAmount: number;
  grandTotalAmount: number;
  status: InstockOrderStatus;
  paymentMethod: string;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryOrderCode: string;
  expectedDeliveryDate: string | null;
  orderDetails: InstockOrderDetailDto[];
}

export interface UpdateInstockOrderStatusRequestDto {
  newStatus: InstockOrderStatus;
}

export interface DeliveryTrackingDetailDto {
  id: string;
  type: string;
  itemId: string;
  quantity: number;
}

export interface InstockOrderDeliveryTrackingDto {
  id: string;
  orderId: string;
  supportTicketId: string | null;
  deliveryOrderCode: string | null;
  status: InstockOrderStatus;
  type: 'Original' | 'Support';
  note: string | null;
  handOverImageUrl: string | null;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  details: DeliveryTrackingDetailDto[];
}

export interface DeliveryTrackingPaginatedResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data: InstockOrderDeliveryTrackingDto[];
}
export interface CreateDeliveryTrackingDto {
  orderId: string;
  supportTicketId?: string | null;
}

export type PartnerDto = {
  id: string;
  importServiceConfigId: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetPartnersResponse = {
  items: PartnerDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type UpsertPartnerRequest = {
  importServiceConfigId: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  slug: string;
  description: string;
};

export interface UpsertImportServiceConfigRequest {
  baseShippingFee: number;
  countryCode: string;
  countryName: string;
  importTaxPercentage: number;
  estimatedDeliveryDays: number;
}

export interface ImportServiceConfigDto {
  id: string;
  baseShippingFee: number;
  countryCode: string;
  countryName: string;
  importTaxPercentage: number;
  estimatedDeliveryDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GetImportServiceConfigsResponse = {
  items: ImportServiceConfigDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};



export type PartnerProductDto = {
  id: string;
  partnerId: string;
  name: string;
  referencePrice: number;
  quantity: number;
  thumbnailUrl: string;
  previewAsset?: Record<string, string> | string[];
  previewAssets?: string[];
  slug: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GetPartnerProductsResponse = {
  items: PartnerProductDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type UpsertPartnerProductRequest = {
  partnerId: string;
  name: string;
  referencePrice: number;
  quantity: number;
  thumbnailUrl: string;
  previewAsset: string[];
  slug: string;
  description: string;
  isActive: boolean;
};

export interface CustomDesignRequest {
  id: string;
  code: string;
  customerId: string;
  customDesignRequirementId: string;
  desiredLengthMm: number;
  desiredWidthMm: number;
  desiredHeightMm: number;
  sketchesUrls: string[];
  customerPrompt: string;
  desiredDeliveryDate: string;
  desiredQuantity: number;
  targetBudget: number;
  usedSupportConceptDesignTime: number;
  status: string;
  note: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRequestsParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}

export interface UpdateCustomDesignRequestPayload {
  desiredLengthMm: number;
  desiredWidthMm: number;
  desiredHeightMm: number;
  sketches: string[];
  customerPrompt: string;
  desiredDeliveryDate: string;
  desiredQuantity: number;
  targetBudget: number;
  status: string;
  note: string;
}


export interface CustomDesignRequirement {
  id: string;
  code: string;
  topicId: string;
  materialId: string;
  assemblyMethodId: string;
  difficulty: string;
  minPartQuantity: number;
  maxPartQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  capabilityIds: string[];
}

export interface UpsertRequirementPayload {
  topicId: string;
  materialId: string;
  assemblyMethodId: string;
  difficulty: string;
  minPartQuantity: number;
  maxPartQuantity: number;
  isActive?: boolean;
  capabilityIds: string[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  streetAddress: string;
  role: string;
  isDeleted: boolean;
}

export type PartnerProductRequestListItemDto = {
  id: string;
  code: string;
  customerId: string;
  partnerId: string;
  totalRequestedQuantity: number;
  note?: string | null;
  status: number;
  createdAt: string;
  updatedAt?: string;
};

export type PartnerProductRequestDetailItemDto = {
  id: string;
  partnerProductId: string;
  quantity: number;
  referencePrice: number;
  referenceTotalAmount: number;
};

export type PartnerProductRequestDetailDto = {
  id: string;
  code: string;
  customerId: string;
  partnerId: string;
  totalRequestedQuantity: number;
  note?: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  details: PartnerProductRequestDetailItemDto[];
};

export type GetPartnerProductRequestsResponse = {
  items: PartnerProductRequestListItemDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type UpdatePartnerProductRequestStatusRequest = {
  newStatus: number;
  note?: string;
};

export type PartnerQuotationDetailItemDto = {
  id: string;
  partnerProductId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
};

export type PartnerQuotationDto = {
  id: string;
  code: string;
  partnerProductRequestId: string;
  subTotalAmount: number;
  shippingFee: number;
  importTaxAmount: number;
  grandTotalAmount: number;
  note?: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  details?: PartnerQuotationDetailItemDto[];
};

export type CreatePartnerQuotationRequest = {
  partnerProductRequestId: string;
  partnerId: string;
  expectedDeliveryDate: string;
  items: {
    partnerProductId: string;
    customUnitPrice: number;
  }[];
};

export type CreatePartnerQuotationResponse = {
  quotationId: string;
};

