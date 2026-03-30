import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Power, X } from "lucide-react";
import { toast } from "sonner";

import {
  getPartners,
  createPartner,
  updatePartner,
  disablePartner,
  enablePartner,
} from "@/services/partnerApi";

import { getImportServiceConfigs } from "@/services/importServiceConfigApi";

import type { PartnerDto, UpsertPartnerRequest } from "@/types/types";
import type { ImportServiceConfigDto } from "@/types/types";

type ModalMode = "create" | "update";

const initialForm: UpsertPartnerRequest = {
  importServiceConfigId: "",
  name: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  slug: "",
  description: "",
};

function buildImportServiceLabel(config: ImportServiceConfigDto) {
  return `${config.countryName} (${config.countryCode})`;
}

export function PartnerApprovals() {
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ImportServiceConfigDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpsertPartnerRequest>(initialForm);

  const serviceConfigMap = useMemo(() => {
    return new Map(serviceConfigs.map((item) => [item.id, item]));
  }, [serviceConfigs]);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    contactEmail?: string;
    contactPhone?: string;
    importServiceConfigId?: string;
  }>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [partnerData, configData] = await Promise.all([
        getPartners(1, 8),
        getImportServiceConfigs(1, 100),
      ]);

      setPartners(partnerData.items);
      setServiceConfigs(configData.items);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đối tác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setOpenModal(false);
    setModalMode("create");
    setSelectedPartnerId(null);
    setFormData(initialForm);
    setFieldErrors({});
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedPartnerId(null);
    setFormData(initialForm);
    setOpenModal(true);
  };

  const openUpdateModal = (partner: PartnerDto) => {
    setModalMode("update");
    setSelectedPartnerId(partner.id);
    setFormData({
      importServiceConfigId: partner.importServiceConfigId,
      name: partner.name,
      contactEmail: partner.contactEmail,
      contactPhone: partner.contactPhone,
      address: partner.address,
      slug: partner.slug,
      description: partner.description,
    });
    setOpenModal(true);
  };

  const handleChange = (field: keyof UpsertPartnerRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };
  const validateForm = () => {
    const errors: {
      name?: string;
      contactEmail?: string;
      contactPhone?: string;
      importServiceConfigId?: string;
    } = {};

    const normalizedName = formData.name.trim().toLowerCase();
    const normalizedEmail = formData.contactEmail.trim().toLowerCase();
    const normalizedPhone = formData.contactPhone.trim();

    if (!formData.importServiceConfigId) {
      errors.importServiceConfigId = "Vui lòng chọn cấu hình dịch vụ nhập khẩu.";
    }

    if (!normalizedName) {
      errors.name = "Vui lòng nhập tên đối tác.";
    } else {
      const duplicatedName = partners.some(
        (partner) =>
          partner.id !== selectedPartnerId &&
          partner.name.trim().toLowerCase() === normalizedName
      );

      if (duplicatedName) {
        errors.name = "Tên đối tác đã tồn tại.";
      }
    }

    if (!normalizedEmail) {
      errors.contactEmail = "Vui lòng nhập email.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        errors.contactEmail = "Email không đúng định dạng.";
      } else {
        const duplicatedEmail = partners.some(
          (partner) =>
            partner.id !== selectedPartnerId &&
            partner.contactEmail.trim().toLowerCase() === normalizedEmail
        );

        if (duplicatedEmail) {
          errors.contactEmail = "Email đã tồn tại.";
        }
      }
    }

    if (!normalizedPhone) {
      errors.contactPhone = "Vui lòng nhập số điện thoại.";
    } else {
      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(normalizedPhone)) {
        errors.contactPhone = "Số điện thoại phải gồm đúng 10 chữ số.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        await createPartner(formData);
        toast.success("Thêm đối tác thành công.");
      } else {
        if (!selectedPartnerId) return;
        await updatePartner(selectedPartnerId, formData);
        toast.success("Cập nhật đối tác thành công.");
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(
        modalMode === "create"
          ? "Thêm đối tác thất bại."
          : "Cập nhật đối tác thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (partner: PartnerDto) => {
    try {
      if (partner.isActive) {
        const confirmed = window.confirm(
          `Bạn có chắc muốn vô hiệu hóa đối tác "${partner.name}" không?`
        );
        if (!confirmed) return;

        await disablePartner(partner.id);
        toast.success("Vô hiệu hóa đối tác thành công.");
      } else {
        await enablePartner(partner.id);
        toast.success("Kích hoạt đối tác thành công.");
      }

      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(
        partner.isActive
          ? "Vô hiệu hóa đối tác thất bại."
          : "Kích hoạt đối tác thất bại."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý đối tác</h1>
        <p className="text-muted-foreground">
          Quản lý danh sách đối tác và cấu hình nhập khẩu tương ứng.
        </p>
      </div>

      <div className="flex justify-start">
        <Button
          onClick={openCreateModal}
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm đối tác
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Đang tải danh sách đối tác...</div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const matchedConfig = serviceConfigMap.get(partner.importServiceConfigId);

            return (
              <Card
                key={partner.id}
                className={`transition-all ${!partner.isActive ? "opacity-50 grayscale" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="line-clamp-1">{partner.name}</CardTitle>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${partner.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {partner.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                    </span>
                  </div>

                  <CardDescription className="line-clamp-2">
                    {partner.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <div className="text-sm space-y-1">
                    <p><strong>Email:</strong> {partner.contactEmail}</p>
                    <p><strong>Số điện thoại:</strong> {partner.contactPhone}</p>
                    <p><strong>Địa chỉ:</strong> {partner.address}</p>
                    <p><strong>Slug:</strong> {partner.slug}</p>
                    <p>
                      <strong>Cấu hình nhập khẩu:</strong>{" "}
                      {matchedConfig
                        ? buildImportServiceLabel(matchedConfig)
                        : partner.importServiceConfigId}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full pt-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => openUpdateModal(partner)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Cập nhật
                    </Button>

                    <Button
                      variant={partner.isActive ? "destructive" : "secondary"}
                      className="w-full"
                      onClick={() => handleToggleStatus(partner)}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {partner.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {modalMode === "create" ? "Thêm đối tác mới" : "Cập nhật đối tác"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {modalMode === "create"
                    ? "Nhập thông tin để tạo đối tác mới."
                    : "Chỉnh sửa thông tin đối tác."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-md p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên đối tác</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nhập tên đối tác"
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-500">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email liên hệ</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    placeholder="Nhập email liên hệ"
                  />
                  {fieldErrors.contactEmail && (
                    <p className="text-sm text-red-500">{fieldErrors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Nhập số điện thoại"
                  />
                  {fieldErrors.contactPhone && (
                    <p className="text-sm text-red-500">{fieldErrors.contactPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="Nhập slug"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Địa chỉ</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <textarea
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Nhập mô tả"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Cấu hình dịch vụ nhập khẩu</label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.importServiceConfigId}
                    onChange={(e) => handleChange("importServiceConfigId", e.target.value)}
                  >
                    <option value="">Chọn quốc gia / mã quốc gia</option>
                    {serviceConfigs
                      .filter((item) => item.isActive)
                      .map((config) => (
                        <option key={config.id} value={config.id}>
                          {buildImportServiceLabel(config)}
                        </option>
                      ))}
                  </select>
                  {fieldErrors.importServiceConfigId && (
                    <p className="text-sm text-red-500">{fieldErrors.importServiceConfigId}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={closeModal}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Đang xử lý..."
                  : modalMode === "create"
                    ? "Thêm đối tác"
                    : "Lưu cập nhật"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}