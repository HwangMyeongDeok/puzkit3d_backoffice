import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  House,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useGetUserById } from "@/hooks/useUserQueries";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getPartnerProductRequestDetail,
  updatePartnerProductRequestStatus,
} from "@/services/partnerProductRequestApi";
import {
  createPartnerQuotation,
  getPartnerQuotationByRequestId,
} from "@/services/partnerProductQuotationApi";
import { getPartnerProductById } from "@/services/partnerProductApi";
import { getPartners } from "@/services/partnerApi";
import type {
  PartnerDto,
  PartnerProductDto,
  PartnerProductRequestDetailDto,
  PartnerQuotationDto,
} from "@/types/types";

type RoleView = "Staff" | "Business Manager";

const REQUEST_STATUS = {
  Pending: 0,
  CancelledByStaff: 1,
  Approved: 2,
  Quoted: 4,
  Accepted: 5,
  RejectedByCustomer: 6,
  CancelledByCustomer: 7,
} as const;

function formatCurrencyVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getDefaultExpectedDeliveryDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function getCustomerFullName(customer?: {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null) {
  const fullName = [customer?.firstName, customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || customer?.email || "—";
}

function normalizeRequestStatus(value: string | number | undefined | null): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return REQUEST_STATUS.Pending;
}

function getRequestStatusMeta(status: number) {
  switch (status) {
    case 0:
      return {
        label: "Pending",
        className: "border border-amber-200 bg-amber-50 text-amber-700",
      };
    case 1:
      return {
        label: "Cancelled by Staff",
        className: "border border-red-200 bg-red-50 text-red-700",
      };
    case 2:
      return {
        label: "Approved",
        className: "border border-blue-200 bg-blue-50 text-blue-700",
      };
    case 4:
      return {
        label: "Quoted",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case 5:
      return {
        label: "Accepted",
        className: "border border-green-200 bg-green-50 text-green-700",
      };
    case 6:
      return {
        label: "Rejected by Customer",
        className: "border border-rose-200 bg-rose-50 text-rose-700",
      };
    case 7:
      return {
        label: "Cancelled by Customer",
        className: "border border-slate-200 bg-slate-100 text-slate-700",
      };
    default:
      return {
        label: `Status ${status}`,
        className: "border border-slate-200 bg-slate-100 text-slate-700",
      };
  }
}

function getQuotationStatusMeta(status: number) {
  switch (status) {
    case 1:
      return {
        label: "Cancelled by Staff",
        className: "border border-red-200 bg-red-50 text-red-700",
      };
    case 4:
      return {
        label: "Quoted",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case 5:
      return {
        label: "Accepted",
        className: "border border-green-200 bg-green-50 text-green-700",
      };
    case 6:
      return {
        label: "Rejected by Customer",
        className: "border border-rose-200 bg-rose-50 text-rose-700",
      };
    case 7:
      return {
        label: "Cancelled by Customer",
        className: "border border-slate-200 bg-slate-100 text-slate-700",
      };
    default:
      return {
        label: `Status ${status}`,
        className: "border border-slate-200 bg-slate-100 text-slate-700",
      };
  }
}

type TimelineNode = {
  key: number;
  label: string;
  danger?: boolean;
};

function buildRequestTimeline(status: number): TimelineNode[] {
  if (status === REQUEST_STATUS.CancelledByStaff) {
    return [
      { key: REQUEST_STATUS.Pending, label: "Pending" },
      { key: REQUEST_STATUS.CancelledByStaff, label: "Cancelled by Staff", danger: true },
    ];
  }

  if (status === REQUEST_STATUS.RejectedByCustomer) {
    return [
      { key: REQUEST_STATUS.Pending, label: "Pending" },
      { key: REQUEST_STATUS.Approved, label: "Approved" },
      { key: REQUEST_STATUS.Quoted, label: "Quoted" },
      { key: REQUEST_STATUS.Accepted, label: "Accepted" },
      { key: REQUEST_STATUS.RejectedByCustomer, label: "Rejected by Customer", danger: true },
    ];
  }

  if (status === REQUEST_STATUS.CancelledByCustomer) {
    return [
      { key: REQUEST_STATUS.Pending, label: "Pending" },
      { key: REQUEST_STATUS.Approved, label: "Approved" },
      { key: REQUEST_STATUS.Quoted, label: "Quoted" },
      { key: REQUEST_STATUS.Accepted, label: "Accepted" },
      { key: REQUEST_STATUS.CancelledByCustomer, label: "Cancelled by Customer", danger: true },
    ];
  }

  return [
    { key: REQUEST_STATUS.Pending, label: "Pending" },
    { key: REQUEST_STATUS.Approved, label: "Approved" },
    { key: REQUEST_STATUS.Quoted, label: "Quoted" },
    { key: REQUEST_STATUS.Accepted, label: "Accepted" },
  ];
}

function getReachedPath(status: number): number[] {
  switch (status) {
    case REQUEST_STATUS.Pending:
      return [REQUEST_STATUS.Pending];
    case REQUEST_STATUS.Approved:
      return [REQUEST_STATUS.Pending, REQUEST_STATUS.Approved];
    case REQUEST_STATUS.Quoted:
      return [REQUEST_STATUS.Pending, REQUEST_STATUS.Approved, REQUEST_STATUS.Quoted];
    case REQUEST_STATUS.Accepted:
      return [
        REQUEST_STATUS.Pending,
        REQUEST_STATUS.Approved,
        REQUEST_STATUS.Quoted,
        REQUEST_STATUS.Accepted,
      ];
    case REQUEST_STATUS.CancelledByStaff:
      return [REQUEST_STATUS.Pending, REQUEST_STATUS.CancelledByStaff];
    case REQUEST_STATUS.RejectedByCustomer:
      return [
        REQUEST_STATUS.Pending,
        REQUEST_STATUS.Approved,
        REQUEST_STATUS.Quoted,
        REQUEST_STATUS.RejectedByCustomer,
      ];
    case REQUEST_STATUS.CancelledByCustomer:
      return [
        REQUEST_STATUS.Pending,
        REQUEST_STATUS.Approved,
        REQUEST_STATUS.Quoted,
        REQUEST_STATUS.Accepted,
        REQUEST_STATUS.CancelledByCustomer,
      ];
    default:
      return [REQUEST_STATUS.Pending];
  }
}

function getNodeState(nodeKey: number, status: number) {
  const reached = getReachedPath(status);

  if (status === REQUEST_STATUS.RejectedByCustomer && nodeKey === REQUEST_STATUS.Accepted) {
    return "upcoming";
  }

  if (status === REQUEST_STATUS.CancelledByStaff && nodeKey === REQUEST_STATUS.CancelledByStaff) {
    return "current-danger";
  }

  if (
    status === REQUEST_STATUS.RejectedByCustomer &&
    nodeKey === REQUEST_STATUS.RejectedByCustomer
  ) {
    return "current-danger";
  }

  if (
    status === REQUEST_STATUS.CancelledByCustomer &&
    nodeKey === REQUEST_STATUS.CancelledByCustomer
  ) {
    return "current-danger";
  }

  const lastReached = reached[reached.length - 1];

  if (nodeKey === lastReached) return "current-success";
  if (reached.includes(nodeKey)) return "done";
  return "upcoming";
}

function isSegmentActive(leftKey: number, rightKey: number, status: number) {
  const reached = getReachedPath(status);
  const leftIndex = reached.indexOf(leftKey);
  const rightIndex = reached.indexOf(rightKey);
  return leftIndex !== -1 && rightIndex !== -1 && rightIndex === leftIndex + 1;
}

function RequestProgress({ status }: { status: number }) {
  const nodes = buildRequestTimeline(status);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] items-center">
        {nodes.map((node, index) => {
          const state = getNodeState(node.key, status);
          const nextNode = nodes[index + 1];

          const circleClass =
            state === "done" || state === "current-success"
              ? "border-green-600 bg-green-600 text-white"
              : state === "current-danger"
                ? "border-red-500 bg-red-500 text-white"
                : "border-slate-200 bg-slate-100 text-slate-500";

          const labelClass =
            state === "done" || state === "current-success"
              ? "text-green-700"
              : state === "current-danger"
                ? "text-red-600"
                : "text-slate-500";

          const connectorClass =
            nextNode && isSegmentActive(node.key, nextNode.key, status)
              ? "bg-green-600"
              : "bg-slate-200";

          return (
            <div key={node.key} className="flex flex-1 items-center">
              <div className="flex min-w-[110px] flex-col items-center text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${circleClass}`}
                >
                  {state === "done" || state === "current-success" ? (
                    <Check className="h-4 w-4" />
                  ) : state === "current-danger" ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span className={`mt-2 text-xs font-medium ${labelClass}`}>{node.label}</span>
              </div>

              {index < nodes.length - 1 ? (
                <div className={`mx-3 h-[2px] flex-1 ${connectorClass}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getQuotedUnitPrice(detail: any, fallbackQuantity = 0) {
  if (!detail) return null;

  const directPrice =
    detail.unitPrice ??
    detail.quotedUnitPrice ??
    detail.finalUnitPrice ??
    detail.price ??
    detail.partnerProductPrice ??
    null;

  if (directPrice != null) return Number(directPrice);

  const quantity = detail.quantity ?? detail.qty ?? fallbackQuantity ?? 0;
  const totalAmount =
    detail.totalAmount ??
    detail.grandTotalAmount ??
    detail.subTotalAmount ??
    detail.referenceTotalAmount ??
    null;

  if (totalAmount != null && quantity > 0) {
    return Number(totalAmount) / Number(quantity);
  }

  return null;
}

function ProductPreviewRow({
  name,
  image,
  referenceUnitPrice,
  quotedUnitPrice,
  quantity,
  totalPrice,
}: {
  name: string;
  image?: string;
  referenceUnitPrice: number;
  quotedUnitPrice?: number | null;
  quantity: number;
  totalPrice: number;
}) {
  const hasQuotedPriceChange =
    quotedUnitPrice != null &&
    Math.round(Number(quotedUnitPrice)) !== Math.round(Number(referenceUnitPrice));

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-slate-50">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-slate-900">{name}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-base">
          {hasQuotedPriceChange ? (
            <>
              <span className="font-medium text-slate-400 line-through">
                {formatCurrencyVND(referenceUnitPrice)} / item
              </span>
              <span className="font-bold text-[#0b4a8b]">
                {formatCurrencyVND(Number(quotedUnitPrice || 0))} / item
              </span>
            </>
          ) : (
            <span className="font-medium text-slate-700">
              {formatCurrencyVND(referenceUnitPrice)} / item
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Quantity: <span className="font-semibold text-slate-700">{quantity}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
        <p className="mt-1 text-2xl font-extrabold text-[#003f88]">
          {formatCurrencyVND(totalPrice)}
        </p>
      </div>
    </div>
  );
}

export default function PartnerProductRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const role: RoleView = user?.role === "Business Manager" ? "Business Manager" : "Staff";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState<PartnerProductRequestDetailDto | null>(null);
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [productsById, setProductsById] = useState<Record<string, PartnerProductDto>>({});
  const [quotation, setQuotation] = useState<PartnerQuotationDto | null>(null);

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [quotedUnitPrices, setQuotedUnitPrices] = useState<Record<string, string>>({});

  const partnerMap = useMemo(() => {
    return new Map(partners.map((partner) => [partner.id, partner]));
  }, [partners]);

  const customerLookupId = detail?.customerId || "";
  const { data: customerUser, isLoading: isCustomerLoading } = useGetUserById(customerLookupId);

  const customerName = isCustomerLoading
    ? "Loading..."
    : customerUser
      ? getCustomerFullName(customerUser)
      : "—";

  const customerPhone = isCustomerLoading ? "Loading..." : customerUser?.phoneNumber || "—";
  const customerEmail = isCustomerLoading ? "Loading..." : customerUser?.email || "—";

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [detailData, partnerData] = await Promise.all([
        getPartnerProductRequestDetail(id),
        getPartners(1, 100, true),
      ]);

      setDetail(detailData);
      setPartners(partnerData.items);
      setRejectMode(false);
      setRejectNote("");

      const productIds = Array.from(
        new Set((detailData.details ?? []).map((item) => item.partnerProductId).filter(Boolean)),
      );

      const productEntries = await Promise.all(
        productIds.map(async (productId) => {
          const productData = await getPartnerProductById(productId);
          return [productId, productData] as const;
        }),
      );

      const nextProductsById = Object.fromEntries(productEntries);
      setProductsById(nextProductsById);

      setQuotedUnitPrices((prev) => {
        const next = { ...prev };

        for (const item of detailData.details ?? []) {
          if (!next[item.partnerProductId]) {
            next[item.partnerProductId] = String(item.referencePrice ?? 0);
          }
        }

        return next;
      });

      try {
        const quotationData = await getPartnerQuotationByRequestId(id);
        setQuotation(quotationData);

        setQuotedUnitPrices((prev) => {
          const next = { ...prev };

          for (const qItem of quotationData.details ?? []) {
            const qUnit = getQuotedUnitPrice(qItem);
            if (qUnit != null) {
              next[qItem.partnerProductId] = String(qUnit);
            }
          }

          return next;
        });
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setQuotation(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load request detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading || !detail) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const requestStatusMeta = getRequestStatusMeta(normalizeRequestStatus(detail.status));
  const quotationStatusMeta = quotation ? getQuotationStatusMeta(quotation.status) : null;
  const partnerInfo = partnerMap.get(detail.partnerId);

const partnerName = partnerInfo?.name || detail.partnerId;
const partnerPhone =
  partnerInfo?.contactPhone || partnerInfo?.address || "—";
const partnerEmail = partnerInfo?.contactEmail || "—";
  const requestItems = detail.details ?? [];
  const quotationDetailMap = new Map<string, any>(
  ((quotation as any)?.details ?? []).map((item: any) => [item.partnerProductId, item]),
);

  const requestItemsView = requestItems.map((item) => {
    const product = productsById[item.partnerProductId];
    const referenceUnitPrice = Number(item.referencePrice || 0);
    const quantity = Number(item.quantity || 0);
    const referenceTotalAmount = Number(item.referenceTotalAmount || referenceUnitPrice * quantity);

    const quoteDetail: any = quotationDetailMap.get(item.partnerProductId);
    const quotedUnitPrice = getQuotedUnitPrice(quoteDetail, quantity);

    const hasQuotedPriceChange =
      quotedUnitPrice != null &&
      Math.round(Number(quotedUnitPrice)) !== Math.round(Number(referenceUnitPrice));

    const totalAmount = quotation
      ? Number(
          quoteDetail?.totalAmount ??
            (quotedUnitPrice != null ? quotedUnitPrice * quantity : referenceTotalAmount),
        )
      : referenceTotalAmount;

    return {
      ...item,
      productName: product?.name || "Unnamed product",
      productImage: product?.thumbnailUrl || "",
      referenceUnitPrice,
      referenceTotalAmount,
      quotedUnitPrice,
      hasQuotedPriceChange,
      quantity,
      totalAmount,
    };
  });

  const reviewTotal = requestItemsView.reduce(
    (sum, item) => sum + Number(item.referenceTotalAmount || 0),
    0,
  );

  const quotedPreviewTotal = requestItemsView.reduce((sum, item) => {
    const quotedUnitPrice = Number(digitsOnly(quotedUnitPrices[item.partnerProductId] || "")) || 0;
    return sum + quotedUnitPrice * Number(item.quantity || 0);
  }, 0);

  const quotedTotal = Number((quotation as any)?.subTotalAmount ?? quotedPreviewTotal ?? reviewTotal);
  const shippingFee = Number((quotation as any)?.shippingFee ?? 0);
  const importTaxAmount = Number((quotation as any)?.importTaxAmount ?? 0);
  const quotationGrandTotal = Number(
    (quotation as any)?.grandTotalAmount ?? quotedTotal + shippingFee + importTaxAmount,
  );

  const hasQuotedTotalChange =
    !!quotation && Math.round(Number(quotedTotal)) !== Math.round(Number(reviewTotal));

  const canStaffApprove =
    role === "Staff" && detail.status === REQUEST_STATUS.Pending && !quotation;

  const normalizedDetailStatus = normalizeRequestStatus(detail.status);

const canStaffReject =
  role === "Staff" &&
  (normalizedDetailStatus === REQUEST_STATUS.Pending ||
    normalizedDetailStatus === REQUEST_STATUS.Approved) &&
  !quotation;

  const canManagerCreateQuotation =
    role === "Business Manager" && !quotation && detail.status === REQUEST_STATUS.Approved;

  const shouldShowRequestSummary = !quotation;

  const handleQuotedPriceChange = (partnerProductId: string, value: string) => {
    setQuotedUnitPrices((prev) => ({
      ...prev,
      [partnerProductId]: digitsOnly(value),
    }));
  };

  const handleApproveRequest = async () => {
    if (!id) return;

    try {
      setSubmitting(true);
      await updatePartnerProductRequestStatus(id, {
        newStatus: REQUEST_STATUS.Approved,
      });

      toast.success("Request approved successfully.");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!id) return;

    if (!rejectNote.trim()) {
      toast.error("Please enter rejection note.");
      return;
    }

    try {
      setSubmitting(true);
      await updatePartnerProductRequestStatus(id, {
        newStatus: REQUEST_STATUS.CancelledByStaff,
        note: rejectNote.trim(),
      });

      toast.success("Request rejected successfully.");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to reject request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (!id || requestItems.length === 0) {
      toast.error("Unable to find request items for quotation.");
      return;
    }

    const invalidItem = requestItemsView.find((item) => {
      const quotedUnitPrice = Number(digitsOnly(quotedUnitPrices[item.partnerProductId] || "")) || 0;
      return quotedUnitPrice <= 0;
    });

    if (invalidItem) {
      toast.error(`Please enter a valid quoted unit price for "${invalidItem.productName}".`);
      return;
    }

    try {
      setSubmitting(true);

      await createPartnerQuotation({
        partnerProductRequestId: id,
        partnerId: detail.partnerId,
        expectedDeliveryDate: getDefaultExpectedDeliveryDate(7),
        items: requestItemsView.map((item) => ({
          partnerProductId: item.partnerProductId,
          customUnitPrice:
            Number(digitsOnly(quotedUnitPrices[item.partnerProductId] || "")) || 0,
        })),
      });

      toast.success("Quotation created successfully.");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate("/partner-product-requests")}
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-2xl font-bold md:text-3xl">Request Details</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-7 py-7">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-slate-500">
                Request Code
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
  <h2 className="text-3xl font-extrabold text-slate-900">#{detail.code}</h2>

  <span
    className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${requestStatusMeta.className}`}
  >
    {requestStatusMeta.label}
  </span>
</div>
            </div>

            <div className="flex shrink-0 items-start md:justify-end">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <Calendar className="h-4 w-4" />
                {formatDateTime(detail.createdAt)}
              </span>
            </div>
          </div>

          <div className="relative mt-5 h-px">
            <div className="absolute left-[-28px] right-[-28px] top-0 border-t border-slate-100" />
          </div>

          <div className="pt-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <House className="h-4 w-4 text-slate-500" />
                <span>{partnerName}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
                <p className="inline-flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">{customerName}</span>
                </p>

                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">{customerPhone}</span>
                </p>

                <p className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">{customerEmail}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-7 py-6">
          <RequestProgress status={detail.status ?? 0} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-7 py-5">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Boxes className="h-5 w-5 text-slate-700" />
            Request Products ({requestItemsView.length})
          </h3>
        </div>

        <div className="space-y-4 px-7 py-6">
          {requestItemsView.map((item) => (
            <ProductPreviewRow
              key={item.id}
              name={item.productName}
              image={item.productImage}
              referenceUnitPrice={item.referenceUnitPrice}
              quotedUnitPrice={quotation ? item.quotedUnitPrice : undefined}
              quantity={item.quantity || 0}
              totalPrice={item.totalAmount}
            />
          ))}
        </div>
      </div>

      {shouldShowRequestSummary ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-5">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <ClipboardList className="h-5 w-5 text-slate-700" />
              Request Summary
            </h3>
          </div>

          <div className="px-7 py-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                  <span>Partner Name</span>
                  <span className="font-semibold text-slate-900">{partnerName}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                  <span>Customer Name</span>
                  <span className="font-semibold text-slate-900">{customerName}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                  <span>Request Status</span>
                  <span className="font-semibold text-slate-900">{requestStatusMeta.label}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                  <span>Total Quantity</span>
                  <span className="font-semibold text-slate-900">
                    {detail.totalRequestedQuantity}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                  <span>Review Total</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrencyVND(reviewTotal)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xl font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrencyVND(reviewTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {detail.note ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Request Note
                </p>
                <p className="text-sm leading-7 text-slate-600">{detail.note}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {role === "Staff" ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-5">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <FileText className="h-5 w-5 text-slate-700" />
              Staff Action
            </h3>
          </div>

          <div className="px-7 py-6">
            {canStaffApprove || canStaffReject ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleApproveRequest}
                    disabled={submitting || !canStaffApprove}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800"
                  >
                    {submitting && canStaffApprove ? "Processing..." : "Accept"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setRejectMode((prev) => !prev)}
                    disabled={submitting || !canStaffReject}
                    className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </div>

                {rejectMode ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
                    <label className="mb-2 block text-sm font-medium text-red-700">
                      Reject note <span className="text-red-600">*</span>
                    </label>

                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-red-200 bg-white px-3 py-3 outline-none"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Enter reason for rejecting this request"
                    />

                    <div className="mt-4 flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectMode(false);
                          setRejectNote("");
                        }}
                        disabled={submitting}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleRejectRequest}
                        disabled={submitting}
                        className="rounded-xl bg-red-600 hover:bg-red-700"
                      >
                        {submitting ? "Rejecting..." : "Confirm Reject"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {!canStaffApprove && detail.status === REQUEST_STATUS.Approved ? (
                  <p className="text-sm text-slate-500">
                    This request is already approved. You can still reject it before quotation is
                    created.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Staff can only accept or reject before quotation is created.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {quotation ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-5">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <ReceiptText className="h-5 w-5 text-slate-700" />
              Quotation Summary
            </h3>
          </div>

          <div className="px-7 py-6">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading quotation...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                      <span>Partner Name</span>
                      <span className="font-semibold text-slate-900">{partnerName}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                      <span>Review Total</span>
                      <span
                        className={
                          hasQuotedTotalChange
                            ? "font-semibold text-slate-400 line-through"
                            : "font-semibold text-slate-900"
                        }
                      >
                        {formatCurrencyVND(reviewTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                      <span>Quoted Total</span>
                      <span className="text-lg font-bold text-[#0b4a8b]">
                        {formatCurrencyVND(quotedTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                      <span>Shipping Fee</span>
                      <span className="font-semibold text-slate-900">
                        + {formatCurrencyVND(shippingFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                      <span>Import Tax</span>
                      <span className="font-semibold text-slate-900">
                        + {formatCurrencyVND(importTaxAmount)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xl font-bold text-slate-900">Total Amount</span>
                          {hasQuotedTotalChange ? (
                            <p className="mt-1 text-sm text-slate-400 line-through">
                              {formatCurrencyVND(reviewTotal)}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-[#0b4a8b]">
                            {formatCurrencyVND(quotationGrandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {detail.note ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Request Note
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{detail.note}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {role === "Business Manager" && !quotation ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-5">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <ReceiptText className="h-5 w-5 text-slate-700" />
              Create Quotation
            </h3>
          </div>

          <div className="px-7 py-6">
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                    <span>Partner Name</span>
                    <span className="font-semibold text-slate-900">{partnerName}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                    <span>Review Total</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrencyVND(reviewTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-base text-slate-700">
                    <span>Quoted Total Preview</span>
                    <span className="text-lg font-bold text-[#0b4a8b]">
                      {formatCurrencyVND(quotedPreviewTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {requestItemsView.map((item) => {
                  const quotedUnitPrice =
                    Number(digitsOnly(quotedUnitPrices[item.partnerProductId] || "")) || 0;
                  const quotedLineTotal = quotedUnitPrice * item.quantity;
                  const hasPreviewChange =
                    quotedUnitPrice > 0 &&
                    Math.round(Number(quotedUnitPrice)) !==
                      Math.round(Number(item.referenceUnitPrice));

                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-4 flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-50">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-900">
                            {item.productName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                            {hasPreviewChange ? (
                              <>
                                <span className="font-medium text-slate-400 line-through">
                                  {formatCurrencyVND(item.referenceUnitPrice)} / item
                                </span>
                                <span className="font-bold text-[#0b4a8b]">
                                  {formatCurrencyVND(quotedUnitPrice)} / item
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-slate-600">
                                {formatCurrencyVND(item.referenceUnitPrice)} / item
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            Quantity:{" "}
                            <span className="font-semibold text-slate-700">{item.quantity}</span>
                          </p>
                        </div>

                        <div className="w-full max-w-[220px] space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Quoted unit price
                          </label>
                          <input
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none"
                            value={quotedUnitPrices[item.partnerProductId] || ""}
                            onChange={(e) =>
                              handleQuotedPriceChange(item.partnerProductId, e.target.value)
                            }
                            placeholder="Enter quoted unit price"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm text-slate-500">
                            {quotedUnitPrice
                              ? `${formatCurrencyVND(quotedUnitPrice)} × ${item.quantity}`
                              : "—"}
                          </p>
                          {hasPreviewChange ? (
                            <p className="mt-1 text-xs text-slate-400 line-through">
                              {formatCurrencyVND(item.referenceTotalAmount)}
                            </p>
                          ) : null}
                        </div>

                        <p className="text-xl font-extrabold text-[#0b4a8b]">
                          {quotedUnitPrice ? formatCurrencyVND(quotedLineTotal) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateQuotation}
                  disabled={submitting || !canManagerCreateQuotation}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800"
                >
                  {submitting ? "Creating quotation..." : "Create quotation"}
                </Button>
              </div>

              {!canManagerCreateQuotation ? (
                <p className="text-sm text-slate-500">
                  Manager can create quotation when request status is Approved.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}