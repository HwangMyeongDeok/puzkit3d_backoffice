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

export interface PartnerProductDto extends Omit<
  InstockProductDto,
  "capabilityIds"
> {
  capabilityId: string;
}

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
    |'PickedUp'
  |'Delivering'
  |'Delivered'
  | 'Processing'
    | 'HandedOverToDelivery'
      | 'Completed'
  | 'Cancelled'
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
  usedCoinAmountAsMoney: number;
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

export interface InstockOrderDeliveryTrackingDto {
  ghnStatus: string;
  orderStatus: InstockOrderStatus;
  statusUpdated: boolean;
}
export interface CreateDeliveryTrackingDto {
  orderId: string;
  supportTicketId?: string | null;
}