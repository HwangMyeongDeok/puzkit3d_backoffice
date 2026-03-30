import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PartnerProductForm } from "@/components/partner-products/PartnerProductForm";
import { getPartners } from "@/services/partnerApi";
import { createPartnerProduct } from "@/services/partnerProductApi";
import { uploadImageApi } from "@/services/uploadimageApi";

import type { PartnerDto } from "@/types/types";
import type { UpsertPartnerProductRequest } from "@/types/types";

const initialForm: UpsertPartnerProductRequest = {
    partnerId: "",
    name: "",
    referencePrice: 0,
    quantity: 0,
    thumbnailUrl: "",
    previewAsset: [],
    slug: "",
    description: "",
    isActive: true,
};

function formatNumberInput(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return Number(digitsOnly).toLocaleString("vi-VN");
}

function parseFormattedNumber(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly ? Number(digitsOnly) : 0;
}

function sanitizeSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function buildPreviewAsset(urls: string[]) {
    return urls.filter(Boolean);
}

export function PartnerProductCreatePage() {
    const navigate = useNavigate();

    const [partners, setPartners] = useState<PartnerDto[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<UpsertPartnerProductRequest>(initialForm);
    const [referencePriceInput, setReferencePriceInput] = useState("");
    const [quantityInput, setQuantityInput] = useState("0");

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewFiles, setPreviewFiles] = useState<(File | null)[]>([null, null, null]);

    const [fieldErrors, setFieldErrors] = useState<{
        partnerId?: string;
        name?: string;
        quantity?: string;
        thumbnailUrl?: string;
    }>({});

    const thumbnailPreviewUrl = useMemo(() => {
        if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
        return formData.thumbnailUrl || "";
    }, [thumbnailFile, formData.thumbnailUrl]);

    const previewImageUrls = useMemo(() => {
        return previewFiles.map((file) => (file ? URL.createObjectURL(file) : ""));
    }, [previewFiles]);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const response = await getPartners(1, 100);
                setPartners(response.items);
            } catch (error) {
                console.error(error);
                toast.error("Không thể tải danh sách đối tác.");
            }
        };

        fetchPartners();
    }, []);

    useEffect(() => {
        return () => {
            if (thumbnailPreviewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(thumbnailPreviewUrl);
            }
            previewImageUrls.forEach((url) => {
                if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
            });
        };
    }, [thumbnailPreviewUrl, previewImageUrls]);

    const handleChange = (field: keyof UpsertPartnerProductRequest, value: string) => {
        if (field === "referencePrice") {
            setReferencePriceInput(formatNumberInput(value));
            setFormData((prev) => ({
                ...prev,
                referencePrice: parseFormattedNumber(value),
            }));
            return;
        }

        if (field === "quantity") {
            const digitsOnly = value.replace(/\D/g, "");
            const numericValue = digitsOnly ? Number(digitsOnly) : 0;

            setQuantityInput(digitsOnly);
            setFormData((prev) => ({
                ...prev,
                quantity: numericValue,
            }));
            setFieldErrors((prev) => ({ ...prev, quantity: undefined }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        setFieldErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    };

    const handleThumbnailFileChange = (file: File) => {
        setThumbnailFile(file);
        setFieldErrors((prev) => ({ ...prev, thumbnailUrl: undefined }));
    };

    const handleRemoveThumbnail = () => {
        setThumbnailFile(null);
        setFormData((prev) => ({
            ...prev,
            thumbnailUrl: "",
        }));
    };

    const handlePreviewFileChange = (index: number, file: File) => {
        setPreviewFiles((prev) => {
            const next = [...prev];
            next[index] = file;
            return next;
        });
    };

    const handleRemovePreviewImage = (index: number) => {
        setPreviewFiles((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const validateForm = () => {
        const errors: {
            partnerId?: string;
            name?: string;
            quantity?: string;
            thumbnailUrl?: string;
        } = {};

        if (!formData.partnerId) {
            errors.partnerId = "Vui lòng chọn đối tác.";
        }

        if (!formData.name.trim()) {
            errors.name = "Vui lòng nhập tên sản phẩm.";
        }

        if (formData.quantity < 0) {
            errors.quantity = "Số lượng phải lớn hơn hoặc bằng 0.";
        }

        if (!thumbnailFile) {
            errors.thumbnailUrl = "Vui lòng chọn ảnh thumbnail.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    setSubmitting(true);

    const safeName = formData.name.trim();
    const safeDescription = formData.description?.trim() || "";

    const slug =
      sanitizeSlug(formData.slug?.trim() || safeName) ||
      `partner-product-${Date.now()}`;

    let finalThumbnailUrl = "";
    const previewUrls = ["", "", ""];

    if (thumbnailFile) {
      const thumbnailResult = await uploadImageApi.uploadSingleImage(
        thumbnailFile,
        "partner-products",
        `${slug}/thumbnail_${Date.now()}`
      );

      finalThumbnailUrl = thumbnailResult.path;
    }

    for (let i = 0; i < previewFiles.length; i++) {
      const file = previewFiles[i];
      if (!file) continue;

      const previewResult = await uploadImageApi.uploadSingleImage(
        file,
        "partner-products",
        `${slug}/preview_${i + 1}_${Date.now()}`
      );

      previewUrls[i] = previewResult.path;
    }

    const payload: UpsertPartnerProductRequest = {
      partnerId: formData.partnerId,
      name: safeName,
      referencePrice: Number(formData.referencePrice) || 0,
      quantity: Number(formData.quantity) || 0,
      thumbnailUrl: finalThumbnailUrl,
      previewAsset: previewUrls.filter(Boolean),
      slug,
      description: safeDescription,
      isActive: formData.isActive,
    };

    await createPartnerProduct(payload);

    toast.success("Thêm sản phẩm đối tác thành công.");
    navigate("/partner-products");
  } catch (error: any) {
    console.error("[CreatePartnerProduct] submit failed", error);
    console.error("[CreatePartnerProduct] response status", error?.response?.status);
    console.error("[CreatePartnerProduct] response data", error?.response?.data);

    if (error?.response?.status === 409) {
      toast.error("Slug hoặc sản phẩm đã tồn tại. Hãy đổi tên hoặc slug khác.");
      return;
    }

    toast.error("Thêm sản phẩm đối tác thất bại.");
  } finally {
    setSubmitting(false);
  }
};

    return (
        <PartnerProductForm
            mode="create"
            formData={formData}
            partners={partners}
            referencePriceInput={referencePriceInput}
            quantityInput={quantityInput}
            fieldErrors={fieldErrors}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            previewImageUrls={previewImageUrls}
            onChange={handleChange}
            onThumbnailFileChange={handleThumbnailFileChange}
            onRemoveThumbnail={handleRemoveThumbnail}
            onPreviewFileChange={handlePreviewFileChange}
            onRemovePreviewImage={handleRemovePreviewImage}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/partner-products")}
            submitting={submitting}
        />
    );
}