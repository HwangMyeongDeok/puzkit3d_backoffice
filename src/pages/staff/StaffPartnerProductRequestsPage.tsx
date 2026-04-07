import { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    FileText,
    Phone,
    ReceiptText,
    User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/store/useAuthStore";
import {
  getPartnerProductRequests,
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
  PartnerProductRequestListItemDto,
  PartnerQuotationDto,
} from "@/types/types";

function formatCurrencyVND(value: number) {
    return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function formatDateTime(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
}

function formatDateTimeLocalInput(value?: string) {
    if (!value) {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().slice(0, 16);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 7);
        return fallback.toISOString().slice(0, 16);
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
}

function getRequestStatusMeta(status: number) {
    switch (status) {
        case 0:
            return {
                label: "Pending",
                className: "bg-amber-50 text-amber-700 border border-amber-200",
            };
        case 1:
            return {
                label: "Cancelled by Staff",
                className: "bg-red-50 text-red-700 border border-red-200",
            };
        case 2:
            return {
                label: "Approved",
                className: "bg-blue-50 text-blue-700 border border-blue-200",
            };
        case 4:
            return {
                label: "Quoted",
                className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            };
        case 5:
            return {
                label: "Accepted",
                className: "bg-green-50 text-green-700 border border-green-200",
            };
        case 6:
            return {
                label: "Rejected by Customer",
                className: "bg-rose-50 text-rose-700 border border-rose-200",
            };
        case 7:
            return {
                label: "Cancelled by Customer",
                className: "bg-slate-100 text-slate-700 border border-slate-200",
            };
        default:
            return {
                label: `Status ${status}`,
                className: "bg-slate-100 text-slate-700 border border-slate-200",
            };
    }
}

function getQuotationStatusMeta(status: number) {
    switch (status) {
        case 1:
            return {
                label: "Cancelled by Staff",
                className: "bg-red-50 text-red-700 border border-red-200",
            };
        case 4:
            return {
                label: "Quoted",
                className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            };
        case 5:
            return {
                label: "Accepted",
                className: "bg-green-50 text-green-700 border border-green-200",
            };
        case 6:
            return {
                label: "Rejected by Customer",
                className: "bg-rose-50 text-rose-700 border border-rose-200",
            };
        case 7:
            return {
                label: "Cancelled by Customer",
                className: "bg-slate-100 text-slate-700 border border-slate-200",
            };
        default:
            return {
                label: `Status ${status}`,
                className: "bg-slate-100 text-slate-700 border border-slate-200",
            };
    }
}

type RoleView = "Staff" | "Business Manager";

type RequestCardProps = {
    request: PartnerProductRequestListItemDto;
    partnerName?: string;
    role: RoleView;
    onUpdated: () => void;
};

function RequestCard({ request, partnerName, role, onUpdated }: RequestCardProps) {
    const [expanded, setExpanded] = useState(false);

    const [loadingCardData, setLoadingCardData] = useState(true);
    const [detail, setDetail] = useState<PartnerProductRequestDetailDto | null>(null);
    const [product, setProduct] = useState<PartnerProductDto | null>(null);
    const [quotation, setQuotation] = useState<PartnerQuotationDto | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const canStaffUpdateStatus =
  role === "Staff" && [0, 1, 2].includes(detail?.status ?? request.status ?? 0);
    const [newStatus, setNewStatus] = useState<number>(request.status ?? 0);
    const [staffNote, setStaffNote] = useState(request.note ?? "");

    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
        formatDateTimeLocalInput()
    );
    const [customUnitPrice, setCustomUnitPrice] = useState("");

    const requestStatusMeta = getRequestStatusMeta(request.status ?? 0);

    const fetchCardData = async () => {
  try {
    setLoadingCardData(true);

    const detailData = await getPartnerProductRequestDetail(request.id);
    setDetail(detailData);
    setNewStatus(detailData.status ?? request.status ?? 0);
    setStaffNote(detailData.note ?? request.note ?? "");

    const firstItem = detailData.details?.[0];
    if (firstItem?.partnerProductId) {
      const productData = await getPartnerProductById(firstItem.partnerProductId);
      setProduct(productData);

      if (!customUnitPrice) {
        setCustomUnitPrice(String(firstItem.referencePrice ?? 0));
      }
    }

    if (role === "Business Manager") {
      try {
        const quotationData = await getPartnerQuotationByRequestId(request.id);
        setQuotation(quotationData);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setQuotation(null);
        } else {
          throw error;
        }
      }
    } else {
      setQuotation(null);
    }
  } catch (error) {
    console.error(error);
    toast.error("Không thể tải dữ liệu request.");
  } finally {
    setLoadingCardData(false);
  }
};

    useEffect(() => {
        fetchCardData();
    }, [request.id, role]);

    const firstDetail = detail?.details?.[0];
    const productName = product?.name || "Unnamed product";
    const productImage = product?.thumbnailUrl || "";
    const productDescription = product?.description || "Không có mô tả.";
    const quantity = firstDetail?.quantity ?? request.totalRequestedQuantity ?? 0;

    const handleUpdateStatus = async () => {
        try {
            setSubmitting(true);

            await updatePartnerProductRequestStatus(request.id, {
                newStatus,
                note: staffNote.trim() || undefined,
            });

            toast.success("Cập nhật trạng thái request thành công.");
            await fetchCardData();
            onUpdated();
        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.message || "Cập nhật trạng thái request thất bại."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateQuotation = async () => {
  if (!firstDetail?.partnerProductId) {
    toast.error("Không tìm thấy sản phẩm để báo giá.");
    return;
  }

  const numericUnitPrice = Number(customUnitPrice.replace(/\D/g, ""));
  if (!numericUnitPrice || numericUnitPrice <= 0) {
    toast.error("Vui lòng nhập đơn giá hợp lệ.");
    return;
  }

  try {
    setSubmitting(true);

    await createPartnerQuotation({
      partnerProductRequestId: request.id,
      partnerId: request.partnerId,
      expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
      items: [
        {
          partnerProductId: firstDetail.partnerProductId,
          customUnitPrice: numericUnitPrice,
        },
      ],
    });

    toast.success("Tạo báo giá thành công.");
    await fetchCardData();
    onUpdated?.();
  } catch (error: any) {
    console.error(error);
    toast.error(error?.response?.data?.message || "Tạo báo giá thất bại.");
  } finally {
    setSubmitting(false);
  }
};

    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-slate-50">
                        {loadingCardData ? (
                            <div className="h-full w-full animate-pulse bg-slate-100" />
                        ) : productImage ? (
                            <img
                                src={productImage}
                                alt={productName}
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
                        <h3 className="truncate text-lg font-bold text-slate-900">
                            {loadingCardData ? "Loading product..." : productName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Request code:{" "}
                            <span className="font-medium text-slate-700">{request.code}</span>
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Partner:{" "}
                            <span className="font-medium text-slate-700">
                                {partnerName || request.partnerId}
                            </span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                            <p>
                                Quantity: <span className="font-medium text-slate-900">{quantity}</span>
                            </p>
                            <p>
                                Created at:{" "}
                                <span className="font-medium text-slate-900">
                                    {formatDateTime(request.createdAt)}
                                </span>
                            </p>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Customer ID: {request.customerId}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>Phone: Chưa có API</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${requestStatusMeta.className}`}
                    >
                        {requestStatusMeta.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-slate-700 hover:bg-slate-50"
                    >
                        {expanded ? (
                            <ChevronUp className="h-5 w-5" />
                        ) : (
                            <ChevronDown className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t bg-slate-50 px-5 py-5">
                    {loadingCardData ? (
                        <div className="text-sm text-slate-500">Đang tải dữ liệu request...</div>
                    ) : !detail ? (
                        <div className="text-sm text-red-500">Không có dữ liệu chi tiết request.</div>
                    ) : (
                        <div className="space-y-5">
                            <div className="rounded-2xl border bg-white p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-slate-700" />
                                    <h4 className="text-base font-bold">Request Detail</h4>
                                </div>

                                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                                    <div className="overflow-hidden rounded-xl border bg-slate-50">
                                        {productImage ? (
                                            <img
                                                src={productImage}
                                                alt={productName}
                                                className="h-32 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{productName}</p>
                                            <p className="mt-1 text-sm text-slate-600">{productDescription}</p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Request code
                                                </p>
                                                <p className="mt-1 text-sm font-medium">{detail.code}</p>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Quantity
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {firstDetail?.quantity ?? 0}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Status
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {getRequestStatusMeta(detail.status).label}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Reference price
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {formatCurrencyVND(firstDetail?.referencePrice ?? 0)}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Reference total
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {formatCurrencyVND(firstDetail?.referenceTotalAmount ?? 0)}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Created at
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {formatDateTime(detail.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Customer
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Customer ID: {detail.customerId}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Tên khách hàng và số điện thoại chưa có API trả về.
                                            </p>
                                        </div>

                                        <div className="rounded-xl border p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Note
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">{detail.note || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {role === "Staff" ? (
                                canStaffUpdateStatus ? (
                                    <div className="rounded-2xl border bg-white p-5">
                                        <h4 className="mb-4 text-base font-bold">Update Request Status</h4>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">New status</label>
                                                <select
                                                    className="w-full rounded-lg border px-3 py-2 outline-none"
                                                    value={newStatus}
                                                    onChange={(e) => setNewStatus(Number(e.target.value))}
                                                >
                                                    <option value={0}>Pending</option>
                                                    <option value={2}>Approved</option>
                                                    <option value={1}>Cancelled by Staff</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Note</label>
                                                <input
                                                    className="w-full rounded-lg border px-3 py-2 outline-none"
                                                    value={staffNote}
                                                    onChange={(e) => setStaffNote(e.target.value)}
                                                    placeholder="Nhập ghi chú"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <Button onClick={handleUpdateStatus} disabled={submitting}>
                                                {submitting ? "Đang cập nhật..." : "Update request status"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border bg-white p-5">
                                        <h4 className="mb-2 text-base font-bold">Request Status</h4>
                                        <p className="text-sm text-slate-600">
                                            Staff có thể xem request này nhưng không thể cập nhật trạng thái ở giai đoạn hiện tại.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="rounded-2xl border bg-white p-5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <ReceiptText className="h-5 w-5 text-slate-700" />
                                        <h4 className="text-base font-bold">Manager Quotation</h4>
                                    </div>

                                    {quotation ? (
                                        <div className="space-y-4">
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Quotation code
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">{quotation.code}</p>
                                                </div>

                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Sub total
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatCurrencyVND(quotation.subTotalAmount)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Shipping fee
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatCurrencyVND(quotation.shippingFee)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Import tax
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatCurrencyVND(quotation.importTaxAmount)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Grand total
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatCurrencyVND(quotation.grandTotalAmount)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Quotation status
                                                    </p>
                                                    <span
                                                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getQuotationStatusMeta(
                                                            quotation.status
                                                        ).className}`}
                                                    >
                                                        {getQuotationStatusMeta(quotation.status).label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Note
                                                </p>
                                                <p className="mt-1 text-sm text-slate-700">{quotation.note || "—"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Expected delivery date</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full rounded-lg border px-3 py-2 outline-none"
                                                        value={expectedDeliveryDate}
                                                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Custom unit price</label>
                                                    <input
                                                        className="w-full rounded-lg border px-3 py-2 outline-none"
                                                        value={customUnitPrice}
                                                        onChange={(e) =>
                                                            setCustomUnitPrice(e.target.value.replace(/\D/g, ""))
                                                        }
                                                        placeholder="Nhập đơn giá báo"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button onClick={handleCreateQuotation} disabled={submitting}>
                                                    {submitting ? "Đang tạo báo giá..." : "Create quotation"}
                                                </Button>
                                            </div>

                                            <p className="text-xs text-slate-500">
                                                Manager chỉ tạo quotation. Backend sẽ tự chuyển request sang trạng thái Quoted.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function StaffPartnerProductRequestsPage() {
    const user = useAuthStore((state) => state.user);
    const role: RoleView =
        user?.role === "Business Manager" ? "Business Manager" : "Staff";

    const [requests, setRequests] = useState<PartnerProductRequestListItemDto[]>([]);
    const [partners, setPartners] = useState<PartnerDto[]>([]);
    const [loading, setLoading] = useState(false);

    const partnerMap = useMemo(() => {
        return new Map(partners.map((partner) => [partner.id, partner.name]));
    }, [partners]);

    const fetchData = async () => {
  try {
    setLoading(true);

    const [requestData, partnerData] = await Promise.all([
      getPartnerProductRequests(1, 8, "", undefined, true),
      getPartners(1, 100, true),
    ]);

    let items = requestData.items;

    if (role === "Business Manager") {
      items = items.filter((item) => [1, 2, 4, 5, 6, 7].includes(item.status));
    }

    setRequests(items);
    setPartners(partnerData.items);
  } catch (error) {
    console.error(error);
    toast.error("Không thể tải danh sách partner product requests.");
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
        fetchData();
    }, [role]);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Partner Product Requests</h1>
                <p className="text-muted-foreground">
                    {role === "Business Manager"
                        ? "Manager xem request, tạo quotation và theo dõi trạng thái sau khi customer phản hồi."
                        : "Staff xem request và cập nhật trạng thái theo quyền staff."}
                </p>
            </div>

            {loading ? (
                <div className="text-sm text-muted-foreground">Đang tải danh sách request...</div>
            ) : requests.length === 0 ? (
                <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
                    Không có request nào.
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            partnerName={partnerMap.get(request.partnerId)}
                            role={role}
                            onUpdated={fetchData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}