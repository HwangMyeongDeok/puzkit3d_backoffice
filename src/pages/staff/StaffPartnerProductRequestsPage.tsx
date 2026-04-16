import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, CalendarDays, Eye, Funnel, Store } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/useAuthStore";
import {
  getPartnerProductRequests,
  getPartnerProductRequestDetail,
} from "@/services/partnerProductRequestApi";
import { getPartnerProductById } from "@/services/partnerProductApi";
import { getPartners } from "@/services/partnerApi";
import type {
  PartnerDto,
  PartnerProductDto,
  PartnerProductRequestDetailDto,
  PartnerProductRequestListItemDto,
} from "@/types/types";

type RoleView = "Staff" | "Business Manager";
type RequestFilter =
  | "all"
  | "pending"
  | "approved"
  | "cancelled"
  | "quoted"
  | "accepted"
  | "rejected";

type RequestCardProps = {
  request: PartnerProductRequestListItemDto;
  partnerName?: string;
};

function formatCurrencyVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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

function getRequestCodeSortValue(code?: string) {
  if (!code) return 0;
  const match = code.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getTotalAmountFromDetail(detail?: PartnerProductRequestDetailDto | null) {
  if (!detail?.details?.length) return 0;

  return detail.details.reduce((sum, item) => {
    const unitPrice = Number(item.referencePrice || 0);
    const quantity = Number(item.quantity || 0);
    const lineTotal = Number(item.referenceTotalAmount || unitPrice * quantity);
    return sum + lineTotal;
  }, 0);
}

function RequestListCard({ request, partnerName }: RequestCardProps) {
  const navigate = useNavigate();

  const [loadingCardData, setLoadingCardData] = useState(true);
  const [detail, setDetail] = useState<PartnerProductRequestDetailDto | null>(null);
  const [productsById, setProductsById] = useState<Record<string, PartnerProductDto>>({});

  const requestStatusMeta = getRequestStatusMeta(request.status ?? 0);

  useEffect(() => {
    let mounted = true;

    const fetchCardData = async () => {
      try {
        setLoadingCardData(true);

        const detailData = await getPartnerProductRequestDetail(request.id);
        if (!mounted) return;

        setDetail(detailData);

        const productIds = Array.from(
          new Set((detailData.details ?? []).map((item) => item.partnerProductId).filter(Boolean))
        );

        const productEntries = await Promise.all(
          productIds.map(async (productId) => {
            const productData = await getPartnerProductById(productId);
            return [productId, productData] as const;
          })
        );

        if (!mounted) return;
        setProductsById(Object.fromEntries(productEntries));
      } catch (error) {
        console.error(error);
        if (mounted) {
          toast.error("Unable to load request preview.");
        }
      } finally {
        if (mounted) setLoadingCardData(false);
      }
    };

    fetchCardData();

    return () => {
      mounted = false;
    };
  }, [request.id]);

  const requestItems = detail?.details ?? [];
  const firstItem = requestItems[0];
  const firstProduct = firstItem ? productsById[firstItem.partnerProductId] : undefined;

  const productName = firstProduct?.name || "Product";
  const productImage = firstProduct?.thumbnailUrl || "";
  const unitPrice = Number(firstItem?.referencePrice || 0);
  const quantity = Number(firstItem?.quantity || 0);
  const totalAmount = getTotalAmountFromDetail(detail);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 px-7 py-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500">
            <Boxes className="h-7 w-7" />
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">
              Request #{request.code}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDateOnly(request.createdAt)}
              </span>

              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4" />
                {partnerName || request.partnerId}
              </span>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${requestStatusMeta.className}`}
        >
          {requestStatusMeta.label}
        </span>
      </div>

      <div className="border-t border-slate-200 px-7 py-6">
        {loadingCardData ? (
          <div className="flex max-w-[420px] items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            Loading request preview...
          </div>
        ) : requestItems.length === 0 ? (
          <div className="flex max-w-[420px] items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            No requested products found.
          </div>
        ) : (
          <div className="flex max-w-[420px] items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {productImage ? (
                  <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 px-1">
                <p className="truncate text-sm font-bold text-slate-900">{productName}</p>

                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-slate-500">{formatCurrencyVND(unitPrice)} /item</p>

                  {requestItems.length > 1 && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      +{requestItems.length - 1}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mr-2 shrink-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm">
                x{quantity}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Total Amount
            </p>
            <p className="mt-1 text-xl font-black text-[#003f88]">
              {formatCurrencyVND(totalAmount)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/partner-product-requests/${request.id}`)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffPartnerProductRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const role: RoleView =
    user?.role === "Business Manager" ? "Business Manager" : "Staff";

  const [allRequests, setAllRequests] = useState<PartnerProductRequestListItemDto[]>([]);
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 8;
  const [activeFilter, setActiveFilter] = useState<RequestFilter>("all");

  const partnerMap = useMemo(() => {
    return new Map(partners.map((partner) => [partner.id, partner.name]));
  }, [partners]);

  const pendingCount = useMemo(
    () => allRequests.filter((item) => item.status === 0).length,
    [allRequests]
  );

  const filteredRequests = useMemo(() => {
    switch (activeFilter) {
      case "pending":
        return allRequests.filter((item) => item.status === 0);
      case "approved":
        return allRequests.filter((item) => item.status === 2);
      case "quoted":
        return allRequests.filter((item) => item.status === 4);
      case "accepted":
        return allRequests.filter((item) => item.status === 5);
      case "rejected":
        return allRequests.filter((item) => item.status === 6);
      case "cancelled":
        return allRequests.filter((item) => item.status === 1);
      default:
        return allRequests;
    }
  }, [allRequests, activeFilter]);

  const totalCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedRequests = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, pageNumber, pageSize]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(1);
    }
  }, [pageNumber, totalPages]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [partnerData, firstPage] = await Promise.all([
        getPartners(1, 100, true),
        getPartnerProductRequests(1, 100, "", undefined, false),
      ]);

      let allItems = [...(firstPage.items || [])];
      const totalPagesFromApi = firstPage.totalPages || 1;

      if (totalPagesFromApi > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPagesFromApi - 1 }, (_, index) =>
            getPartnerProductRequests(index + 2, 100, "", undefined, false)
          )
        );

        for (const page of remainingPages) {
          allItems.push(...(page.items || []));
        }
      }

      allItems = allItems.sort(
        (a, b) => getRequestCodeSortValue(b.code) - getRequestCodeSortValue(a.code)
      );

      setAllRequests(allItems);
      setPartners(partnerData.items);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load partner product requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const handleChangeFilter = (filter: RequestFilter) => {
    setActiveFilter(filter);
    setPageNumber(1);
  };

  const filterButtons: Array<{
    key: RequestFilter;
    label: string;
  }> = [
    { key: "all", label: "All Requests" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "quoted", label: "Quoted" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected by Customer" },
    { key: "cancelled", label: "Cancelled by Staff" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Partner Product Requests
              </h1>

              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                {pendingCount} pending
              </span>
            </div>

            <p className="mt-2 text-slate-500">
              {role === "Business Manager"
                ? "Managers review requests from the list and open details to create quotations."
                : "Staff review requests from the list and open details to update request status."}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Funnel className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          {filterButtons.map((item) => {
            const isActive = activeFilter === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleChangeFilter(item.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
          Loading requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
          No partner product requests found.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedRequests.map((request) => (
              <RequestListCard
                key={request.id}
                request={request}
                partnerName={partnerMap.get(request.partnerId)}
              />
            ))}
          </div>

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white px-5 py-4 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-600">
              Showing page <span className="font-semibold text-slate-900">{pageNumber}</span> /{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
              <span className="ml-3">
                Total requests:{" "}
                <span className="font-semibold text-slate-900">{totalCount}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                disabled={pageNumber >= totalPages}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 