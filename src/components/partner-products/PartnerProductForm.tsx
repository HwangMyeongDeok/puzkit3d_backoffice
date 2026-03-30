import { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ImagePlus, X, RefreshCw } from "lucide-react";
import type { PartnerDto } from "@/types/types";
import type { UpsertPartnerProductRequest } from "@/types/types";

type FieldErrors = {
  partnerId?: string;
  name?: string;
  quantity?: string;
  thumbnailUrl?: string;
};

type Props = {
  mode: "create" | "edit";
  formData: UpsertPartnerProductRequest;
  partners: PartnerDto[];
  referencePriceInput: string;
  quantityInput: string;
  fieldErrors: FieldErrors;

  thumbnailPreviewUrl: string;
  previewImageUrls: string[];

  onChange: (field: keyof UpsertPartnerProductRequest, value: string) => void;
  onThumbnailFileChange: (file: File) => void;
  onRemoveThumbnail: () => void;
  onPreviewFileChange: (index: number, file: File) => void;
  onRemovePreviewImage: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
};

const PREVIEW_SLOTS = 3;

export function PartnerProductForm({
  mode,
  formData,
  partners,
  referencePriceInput,
  quantityInput,
  fieldErrors,
  thumbnailPreviewUrl,
  previewImageUrls,
  onChange,
  onThumbnailFileChange,
  onRemoveThumbnail,
  onPreviewFileChange,
  onRemovePreviewImage,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const previewInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedPreviews = useMemo(() => {
    return Array.from({ length: PREVIEW_SLOTS }, (_, index) => previewImageUrls[index] || "");
  }, [previewImageUrls]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">
          {mode === "create" ? "Tạo sản phẩm đối tác" : "Cập nhật sản phẩm đối tác"}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Đối tác</label>
            <select
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={formData.partnerId}
              onChange={(e) => onChange("partnerId", e.target.value)}
            >
              <option value="">Chọn đối tác</option>
              {partners
                .filter((partner) => partner.isActive)
                .map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
            </select>
            {fieldErrors.partnerId && (
              <p className="text-sm text-red-500">{fieldErrors.partnerId}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tên sản phẩm</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Nhập tên sản phẩm"
            />
            {fieldErrors.name && (
              <p className="text-sm text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={formData.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="Nhập slug"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Số lượng</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={quantityInput}
              onChange={(e) => onChange("quantity", e.target.value)}
              placeholder="Nhập số lượng"
            />
            {fieldErrors.quantity && (
              <p className="text-sm text-red-500">{fieldErrors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giá tham chiếu</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-lg border px-3 py-2 pr-16 outline-none"
                value={referencePriceInput}
                onChange={(e) => onChange("referencePrice", e.target.value)}
                placeholder="Nhập giá tham chiếu"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                VNĐ
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 outline-none"
              rows={4}
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Nhập mô tả"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">Hình ảnh</h2>

        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm font-medium">Thumbnail</p>

            <input
  ref={thumbnailInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      onThumbnailFileChange(file);
    }
    e.currentTarget.value = "";
  }}
/>

            <div className="w-[220px]">
              <div className="relative overflow-hidden rounded-xl border bg-slate-50">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="flex h-[220px] w-[220px] items-center justify-center"
                >
                  {thumbnailPreviewUrl ? (
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="h-8 w-8" />
                      <span>Upload thumbnail</span>
                    </div>
                  )}
                </button>

                {thumbnailPreviewUrl && (
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="rounded-full bg-white p-3 shadow"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onRemoveThumbnail}
                      className="rounded-full bg-white p-3 shadow text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {fieldErrors.thumbnailUrl && (
                <p className="mt-2 text-sm text-red-500">{fieldErrors.thumbnailUrl}</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">
              Preview Images ({normalizedPreviews.filter(Boolean).length}/3)
            </p>

            <div className="flex flex-wrap gap-4">
              {normalizedPreviews.map((imageSrc, index) => (
                <div key={index} className="w-[140px]">
                  <input
  ref={(el) => {
    previewInputRefs.current[index] = el;
  }}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPreviewFileChange(index, file);
    }
    e.currentTarget.value = "";
  }}
/>

                  <div className="relative overflow-hidden rounded-xl border bg-slate-50">
                    <button
                      type="button"
                      onClick={() => previewInputRefs.current[index]?.click()}
                      className="flex h-[140px] w-[140px] items-center justify-center"
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <ImagePlus className="h-7 w-7" />
                          <span>Add</span>
                        </div>
                      )}
                    </button>

                    {imageSrc && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => previewInputRefs.current[index]?.click()}
                          className="rounded-full bg-white p-2 shadow"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemovePreviewImage(index)}
                          className="rounded-full bg-white p-2 shadow text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting
            ? "Đang xử lý..."
            : mode === "create"
            ? "Tạo sản phẩm"
            : "Lưu cập nhật"}
        </Button>
      </div>
    </div>
  );
}