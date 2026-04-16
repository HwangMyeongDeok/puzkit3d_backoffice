import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Package2,
  ReceiptText,
  User,
  Wallet,
  XCircle,
  Clock3,
  BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getPartnerProductRequestDetail } from '@/services/partnerProductRequestApi';
import {
  createPartnerQuotation,
  getPartnerQuotationByRequestId,
} from '@/services/partnerProductQuotationApi';
import { getPartnerProductById } from '@/services/partnerProductApi';
import { getPartners } from '@/services/partnerApi';

import type {
  PartnerDto,
  PartnerProductDto,
  PartnerProductRequestDetailDto,
  PartnerQuotationDto,
} from '@/types/types';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function formatNumberInput(value: string) {
  const onlyDigits = digitsOnly(value);
  if (!onlyDigits) return '';
  return Number(onlyDigits).toLocaleString('en-US');
}

function parseNumberInput(value: string) {
  const onlyDigits = digitsOnly(value);
  return onlyDigits ? Number(onlyDigits) : 0;
}

function formatCurrencyVND(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateOnly(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
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
        label: 'Pending',
        icon: <Clock3 className="h-4 w-4" />,
        className: 'border border-amber-200 bg-amber-50 text-amber-700',
      };
    case 1:
      return {
        label: 'Cancelled by Staff',
        icon: <XCircle className="h-4 w-4" />,
        className: 'border border-red-200 bg-red-50 text-red-700',
      };
    case 2:
      return {
        label: 'Approved',
        icon: <BadgeCheck className="h-4 w-4" />,
        className: 'border border-blue-200 bg-blue-50 text-blue-700',
      };
    case 4:
      return {
        label: 'Quoted',
        icon: <ReceiptText className="h-4 w-4" />,
        className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 5:
      return {
        label: 'Accepted',
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: 'border border-green-200 bg-green-50 text-green-700',
      };
    case 6:
      return {
        label: 'Rejected by Customer',
        icon: <XCircle className="h-4 w-4" />,
        className: 'border border-rose-200 bg-rose-50 text-rose-700',
      };
    case 7:
      return {
        label: 'Cancelled by Customer',
        icon: <XCircle className="h-4 w-4" />,
        className: 'border border-slate-200 bg-slate-100 text-slate-700',
      };
    default:
      return {
        label: `Status ${status}`,
        icon: <Clock3 className="h-4 w-4" />,
        className: 'border border-slate-200 bg-slate-100 text-slate-700',
      };
  }
}

function getQuotationStatusMeta(status: number) {
  switch (status) {
    case 4:
      return {
        label: 'Quoted',
        icon: <ReceiptText className="h-4 w-4" />,
        className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    case 5:
      return {
        label: 'Accepted',
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: 'border border-green-200 bg-green-50 text-green-700',
      };
    case 6:
      return {
        label: 'Rejected by Customer',
        icon: <XCircle className="h-4 w-4" />,
        className: 'border border-rose-200 bg-rose-50 text-rose-700',
      };
    default:
      return {
        label: `Status ${status}`,
        icon: <Clock3 className="h-4 w-4" />,
        className: 'border border-slate-200 bg-slate-100 text-slate-700',
      };
  }
}

type ProductView = {
  requestDetailItemId: string;
  partnerProductId: string;
  productName: string;
  productImage: string;
  quantity: number;
  referencePrice: number;
  referenceTotalAmount: number;
  quotedUnitPriceInput: string;
};

export default function QuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [requestDetail, setRequestDetail] = useState<PartnerProductRequestDetailDto | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [products, setProducts] = useState<ProductView[]>([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16);
  });

  const [existingQuotation, setExistingQuotation] = useState<PartnerQuotationDto | null>(null);

  const fetchData = async () => {
    if (!id) {
      toast.error('Request ID is missing.');
      navigate(-1);
      return;
    }

    try {
      setLoading(true);

      const detail = await getPartnerProductRequestDetail(id);
      setRequestDetail(detail);

      const partnerPromise = getPartners(1, 100, true);
      const productPromises = (detail.details ?? []).map((item) =>
        getPartnerProductById(item.partnerProductId)
      );

      const [partnersResponse, ...productResponses] = await Promise.all([
        partnerPromise,
        ...productPromises,
      ]);

      const partner = (partnersResponse.items || []).find(
        (item: PartnerDto) => item.id === detail.partnerId
      );
      setPartnerName(partner?.name || detail.partnerId);

      const nextProducts: ProductView[] = (detail.details ?? []).map((item, index) => {
        const product = productResponses[index] as PartnerProductDto | undefined;

        return {
          requestDetailItemId: item.id,
          partnerProductId: item.partnerProductId,
          productName: product?.name || 'Unnamed product',
          productImage: product?.thumbnailUrl || '',
          quantity: item.quantity || 0,
          referencePrice: Number(item.referencePrice || 0),
          referenceTotalAmount: Number(item.referenceTotalAmount || 0),
          quotedUnitPriceInput: formatNumberInput(String(item.referencePrice || 0)),
        };
      });

      setProducts(nextProducts);

      try {
        const quotation = await getPartnerQuotationByRequestId(id);
        setExistingQuotation(quotation);

        const quotationAny = quotation as PartnerQuotationDto & Record<string, any>;
        setExpectedDeliveryDate(
          formatDateTimeLocalInput(
            quotationAny.expectedDeliveryDate || quotationAny.deliveryDate
          )
        );
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setExistingQuotation(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to load quotation request data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const productsWithComputedPrice = useMemo(() => {
    return products.map((item) => {
      const quotedUnitPrice = parseNumberInput(item.quotedUnitPriceInput);
      return {
        ...item,
        quotedUnitPrice,
        quotedTotal: quotedUnitPrice * item.quantity,
      };
    });
  }, [products]);

  const summary = useMemo(() => {
    const referenceGrandTotal = productsWithComputedPrice.reduce(
      (sum, item) => sum + item.referenceTotalAmount,
      0
    );

    const quotedSubtotal = productsWithComputedPrice.reduce(
      (sum, item) => sum + item.quotedTotal,
      0
    );

    const totalQuantity = productsWithComputedPrice.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return {
      referenceGrandTotal,
      quotedSubtotal,
      totalQuantity,
      totalProducts: productsWithComputedPrice.length,
    };
  }, [productsWithComputedPrice]);

  const requestStatusMeta = getRequestStatusMeta(requestDetail?.status ?? 0);
  const quotationStatusMeta = existingQuotation
    ? getQuotationStatusMeta(existingQuotation.status)
    : null;

  const handleQuotedPriceChange = (partnerProductId: string, value: string) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.partnerProductId === partnerProductId
          ? {
              ...item,
              quotedUnitPriceInput: formatNumberInput(value),
            }
          : item
      )
    );
  };

  const handleCreateQuotation = async () => {
    if (!requestDetail || !id) return;

    const invalidItem = productsWithComputedPrice.find(
      (item) => !item.quotedUnitPrice || item.quotedUnitPrice <= 0
    );

    if (invalidItem) {
      toast.error(`Please enter a valid quoted price for "${invalidItem.productName}".`);
      return;
    }

    try {
      setSubmitting(true);

      await createPartnerQuotation({
        partnerProductRequestId: id,
        partnerId: requestDetail.partnerId,
        expectedDeliveryDate: new Date(expectedDeliveryDate).toISOString(),
        items: productsWithComputedPrice.map((item) => ({
          partnerProductId: item.partnerProductId,
          customUnitPrice: item.quotedUnitPrice,
        })),
      });

      toast.success('Quotation created successfully.');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to create quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center p-6">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading quotation builder...
        </div>
      </div>
    );
  }

  if (!requestDetail) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 p-6">
        <Button variant="outline" className="w-fit" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Request detail not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <ReceiptText className="h-6 w-6 text-emerald-600" />
              Partner Product Quotation
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manager can set a specific quoted price for each product in this request.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${requestStatusMeta.className}`}
          >
            {requestStatusMeta.icon}
            {requestStatusMeta.label}
          </span>

          {quotationStatusMeta ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${quotationStatusMeta.className}`}
            >
              {quotationStatusMeta.icon}
              {quotationStatusMeta.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Request Overview</h2>
          </div>

          <p className="mb-5 text-sm text-slate-600">
            This section shows the request information after staff review and approval.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Request code
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {requestDetail.code || '—'}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Partner name
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{partnerName || '—'}</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Request date
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatDateTime(requestDetail.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Requested quantity
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {summary.totalQuantity}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {productsWithComputedPrice.map((item) => (
              <div
                key={item.requestDetailItemId}
                className="flex items-center gap-4 rounded-2xl border bg-white p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-slate-50">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-slate-900">
                    {item.productName}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatCurrencyVND(item.referencePrice)} × {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Request total
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {formatCurrencyVND(item.referenceTotalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-extrabold text-slate-900">Manager Quotation</h2>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Update a specific quoted price for each product in this request.
              </p>
            </div>

            {existingQuotation ? (
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-700">
                Quotation created
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total products
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {summary.totalProducts}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total request value
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {formatCurrencyVND(summary.referenceGrandTotal)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border bg-white p-4">
            <label className="text-sm font-medium text-slate-700">
              Expected delivery date
            </label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-xl border px-3 py-2.5 outline-none"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              disabled={!!existingQuotation}
            />
            <p className="mt-2 text-xs text-slate-500">
              Display format: {formatDateOnly(expectedDeliveryDate)}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {productsWithComputedPrice.map((item) => (
              <div key={item.requestDetailItemId} className="rounded-2xl border bg-white p-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-slate-50">
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
                    <p className="mt-1 text-sm text-slate-500">
                      {formatCurrencyVND(item.referencePrice)} × {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Quoted unit price
                    </label>
                    <input
                      className="w-full rounded-xl border px-3 py-2.5 outline-none"
                      value={item.quotedUnitPriceInput}
                      onChange={(e) =>
                        handleQuotedPriceChange(item.partnerProductId, e.target.value)
                      }
                      placeholder="Enter quoted unit price"
                      disabled={!!existingQuotation}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Quoted total
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.quotedUnitPrice
                          ? `${formatCurrencyVND(item.quotedUnitPrice)} × ${item.quantity}`
                          : '—'}
                      </p>
                    </div>

                    <p className="text-2xl font-extrabold text-slate-900">
                      {item.quotedUnitPrice
                        ? formatCurrencyVND(item.quotedTotal)
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Total quotation value
                </p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">
                  {formatCurrencyVND(summary.quotedSubtotal)}
                </p>
              </div>

              {!existingQuotation ? (
                <Button onClick={handleCreateQuotation} disabled={submitting}>
                  {submitting ? 'Creating quotation...' : 'Create quotation'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}