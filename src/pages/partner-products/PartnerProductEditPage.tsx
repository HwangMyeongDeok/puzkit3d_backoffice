import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PartnerProductForm } from "@/components/partner-products/PartnerProductForm";
import { getPartners } from "@/services/partnerApi";
import {
  getPartnerProductById,
  updatePartnerProduct,
} from "@/services/partnerProductApi";
import { uploadImageApi } from "@/services/uploadimageApi";
import { resolveAssetUrl } from "@/lib/media";

import type { PartnerDto } from "@/types/types";
import type {
  PartnerProductDto,
  UpsertPartnerProductRequest,
} from "@/types/types";

const PREVIEW_SLOTS = 3;

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

function toStoredAssetPath(value?: string | null) {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return trimmed.replace(/^\/+/, "");
  }
}

function buildPreviewAsset(paths: string[]) {
  return paths.filter(Boolean).map((item) => toStoredAssetPath(item));
}

function extractRawPreviewPaths(productData: PartnerProductDto) {
  const rawSource = productData.previewAsset ?? productData.previewAssets;

  if (!rawSource) return ["", "", ""];

  if (Array.isArray(rawSource)) {
    return Array.from({ length: PREVIEW_SLOTS }, (_, index) =>
      toStoredAssetPath(rawSource[index] || "")
    );
  }

  return Array.from({ length: PREVIEW_SLOTS }, (_, index) =>
    toStoredAssetPath(rawSource[String(index)] || "")
  );
}

export function PartnerProductEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [product, setProduct] = useState<PartnerProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<UpsertPartnerProductRequest>(initialForm);
  const [referencePriceInput, setReferencePriceInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("0");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<(File | null)[]>([null, null, null]);
  const [existingPreviewPaths, setExistingPreviewPaths] = useState<string[]>(["", "", ""]);

  const [fieldErrors, setFieldErrors] = useState<{
    partnerId?: string;
    name?: string;
    quantity?: string;
    thumbnailUrl?: string;
  }>({});

  const thumbnailPreviewUrl = useMemo(() => {
    if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
    return resolveAssetUrl(formData.thumbnailUrl);
  }, [thumbnailFile, formData.thumbnailUrl]);

  const previewImageUrls = useMemo(() => {
    return Array.from({ length: PREVIEW_SLOTS }, (_, index) => {
      if (previewFiles[index]) {
        return URL.createObjectURL(previewFiles[index] as File);
      }
      return resolveAssetUrl(existingPreviewPaths[index]) || "";
    });
  }, [previewFiles, existingPreviewPaths]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, partnerData] = await Promise.all([
          getPartnerProductById(id),
          getPartners(1, 100),
        ]);

        const previewPaths = extractRawPreviewPaths(productData);

        setProduct(productData);
        setPartners(partnerData.items);
        setExistingPreviewPaths(previewPaths);

        setFormData({
  partnerId: productData.partnerId,
  name: productData.name || "",
  referencePrice: Number(productData.referencePrice) || 0,
  quantity: Number(productData.quantity) || 0,
  thumbnailUrl: toStoredAssetPath(productData.thumbnailUrl || ""),
  previewAsset: buildPreviewAsset(previewPaths),
  slug: productData.slug || "",
  description: productData.description || "",
  isActive: !!productData.isActive,
});

        setReferencePriceInput(productData.referencePrice.toLocaleString("vi-VN"));
        setQuantityInput(String(productData.quantity));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load product information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

    setExistingPreviewPaths((prev) => {
      const next = [...prev];
      next[index] = "";
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
      errors.partnerId = "Please select a partner.";
    }

    if (!formData.name.trim()) {
      errors.name = "Please enter the product name.";
    }

    if (formData.quantity < 0) {
      errors.quantity = "Quantity must be greater than or equal to 0.";
    }

    if (!thumbnailFile && !formData.thumbnailUrl.trim()) {
      errors.thumbnailUrl = "Please select a thumbnail image.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const slug =
        sanitizeSlug(formData.slug || formData.name || "") ||
        id ||
        `partner-product-${Date.now()}`;

      let finalThumbnailPath = toStoredAssetPath(formData.thumbnailUrl);
      const nextPreviewPaths = [...existingPreviewPaths];

      if (thumbnailFile) {
        const thumbnailResult = await uploadImageApi.uploadSingleImage(
          thumbnailFile,
          "partner-products",
          `${slug}/thumbnail_${Date.now()}`
        );

        finalThumbnailPath = thumbnailResult.path;
      }

      for (let i = 0; i < previewFiles.length; i++) {
        const file = previewFiles[i];
        if (!file) continue;

        const previewResult = await uploadImageApi.uploadSingleImage(
          file,
          "partner-products",
          `${slug}/preview_${i + 1}_${Date.now()}`
        );

        nextPreviewPaths[i] = previewResult.path;
      }

      const payload: UpsertPartnerProductRequest = {
        ...formData,
        slug,
        thumbnailUrl: toStoredAssetPath(finalThumbnailPath),
        previewAsset: buildPreviewAsset(nextPreviewPaths),
      };

      await updatePartnerProduct(id, payload);
      toast.success("Partner product updated successfully.");
      navigate("/partner-products");
    } catch (error: any) {
      console.error("[UpdatePartnerProduct] failed", error);
      console.error("[UpdatePartnerProduct] response status", error?.response?.status);
      console.error("[UpdatePartnerProduct] response data", error?.response?.data);
      toast.error("Failed to update partner product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading data...</div>;
  }

  if (!product) {
    return <div className="text-sm text-red-500">Product not found.</div>;
  }

  return (
    <PartnerProductForm
      mode="edit"
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