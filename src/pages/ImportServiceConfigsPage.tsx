import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Pencil, Power, X } from "lucide-react";
import {
  getImportServiceConfigs,
  createImportServiceConfig,
  updateImportServiceConfig,
  disableImportServiceConfig,
  enableImportServiceConfig,
} from "@/services/importServiceConfigApi";
import type {
  ImportServiceConfigDto,
  UpsertImportServiceConfigRequest,
} from "@/types/types";

type ModalMode = "create" | "update";

const initialForm: UpsertImportServiceConfigRequest = {
  baseShippingFee: 0,
  countryCode: "",
  countryName: "",
  importTaxPercentage: 0,
};
function formatCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("vi-VN");
}

function parseCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
}

function sanitizeDecimalInput(value: string) {
  let normalized = value.replace(/,/g, ".");
  normalized = normalized.replace(/[^0-9.]/g, "");

  const parts = normalized.split(".");
  if (parts.length > 2) {
    normalized = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  if (normalized.startsWith(".")) {
    normalized = `0${normalized}`;
  }

  const [integerPart, decimalPart] = normalized.split(".");
  const cleanedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";

  if (decimalPart !== undefined) {
    return `${cleanedInteger}.${decimalPart}`;
  }

  return cleanedInteger === "0" && normalized === "" ? "" : cleanedInteger;
}

function parseDecimalInput(value: string) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrencyVND(value: number) {
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function formatPercentage(value: number) {
  return `${value.toLocaleString("vi-VN")} %`;
}
export function ImportServiceConfigsPage() {
  const [configs, setConfigs] = useState<ImportServiceConfigDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpsertImportServiceConfigRequest>(initialForm);
  const [baseShippingFeeInput, setBaseShippingFeeInput] = useState("");
  const [importTaxPercentageInput, setImportTaxPercentageInput] = useState("");

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportServiceConfigs(1, 8);
      setConfigs(data.items);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách cấu hình dịch vụ nhập khẩu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const closeModal = () => {
    setOpenModal(false);
    setModalMode("create");
    setSelectedConfigId(null);
    setFormData(initialForm);
    setBaseShippingFeeInput("");
    setImportTaxPercentageInput("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedConfigId(null);
    setFormData(initialForm);
    setBaseShippingFeeInput("");
    setImportTaxPercentageInput("");
    setOpenModal(true);
  };

  const openUpdateModal = (config: ImportServiceConfigDto) => {
    setModalMode("update");
    setSelectedConfigId(config.id);
    setFormData({
      baseShippingFee: config.baseShippingFee,
      countryCode: config.countryCode,
      countryName: config.countryName,
      importTaxPercentage: config.importTaxPercentage,
    });
    setBaseShippingFeeInput(config.baseShippingFee.toLocaleString("vi-VN"));
    setImportTaxPercentageInput(String(config.importTaxPercentage).replace(/,/g, "."));
    setOpenModal(true);
  };

  const handleChange = (
    field: keyof UpsertImportServiceConfigRequest,
    value: string
  ) => {
    if (field === "baseShippingFee") {
      const formatted = formatCurrencyInput(value);
      setBaseShippingFeeInput(formatted);
      setFormData((prev) => ({
        ...prev,
        baseShippingFee: parseCurrencyInput(value),
      }));
      return;
    }

    if (field === "importTaxPercentage") {
      const sanitized = sanitizeDecimalInput(value);
      setImportTaxPercentageInput(sanitized);
      setFormData((prev) => ({
        ...prev,
        importTaxPercentage: parseDecimalInput(sanitized),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (modalMode === "create") {
        await createImportServiceConfig(formData);
        toast.success("Thêm cấu hình thành công.");
      } else {
        if (!selectedConfigId) return;
        await updateImportServiceConfig(selectedConfigId, formData);
        toast.success("Cập nhật cấu hình thành công.");
      }

      closeModal();
      await fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(
        modalMode === "create"
          ? "Thêm cấu hình thất bại."
          : "Cập nhật cấu hình thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (config: ImportServiceConfigDto) => {
    try {
      if (config.isActive) {
        const confirmed = window.confirm(
          `Bạn có chắc muốn vô hiệu hóa cấu hình của quốc gia "${config.countryName}" không?`
        );

        if (!confirmed) return;

        await disableImportServiceConfig(config.id);
        toast.success("Vô hiệu hóa cấu hình thành công.");
      } else {
        await enableImportServiceConfig(config.id);
        toast.success("Kích hoạt cấu hình thành công.");
      }

      await fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(
        config.isActive
          ? "Vô hiệu hóa cấu hình thất bại."
          : "Kích hoạt cấu hình thất bại."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cấu hình dịch vụ nhập khẩu</h1>
        <p className="text-muted-foreground">
          Quản lý cấu hình dịch vụ nhập khẩu.
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
          Thêm cấu hình
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">
          Đang tải danh sách cấu hình...
        </div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card
              key={config.id}
              className={`transition-all ${!config.isActive ? "opacity-50 grayscale" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="line-clamp-1">{config.countryName}</CardTitle>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${config.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                  >
                    {config.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                  </span>
                </div>

                <CardDescription className="line-clamp-2">
                  Mã quốc gia: {config.countryCode}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="text-sm space-y-1">
                  <p><strong>Phí vận chuyển cơ bản:</strong> {formatCurrencyVND(config.baseShippingFee)}</p>
                  <p><strong>Thuế nhập khẩu:</strong> {formatPercentage(config.importTaxPercentage)}</p>
                  <p><strong>Tạo lúc:</strong> {new Date(config.createdAt).toLocaleString("vi-VN")}</p>
                  <p><strong>Cập nhật lúc:</strong> {new Date(config.updatedAt).toLocaleString("vi-VN")}</p>
                </div>

                <div className="flex gap-2 w-full pt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => openUpdateModal(config)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Cập nhật
                  </Button>

                  <Button
                    variant={config.isActive ? "destructive" : "secondary"}
                    className="w-full"
                    onClick={() => handleToggleStatus(config)}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {config.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {modalMode === "create" ? "Thêm cấu hình mới" : "Cập nhật cấu hình"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {modalMode === "create"
                    ? "Nhập thông tin để tạo cấu hình dịch vụ nhập khẩu."
                    : "Chỉnh sửa thông tin cấu hình dịch vụ nhập khẩu."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-md p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên quốc gia</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.countryName}
                  onChange={(e) => handleChange("countryName", e.target.value)}
                  placeholder="Nhập tên quốc gia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mã quốc gia</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.countryCode}
                  onChange={(e) => handleChange("countryCode", e.target.value)}
                  placeholder="Nhập mã quốc gia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phí vận chuyển cơ bản</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-lg border px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-blue-500"
                    value={baseShippingFeeInput}
                    onChange={(e) => handleChange("baseShippingFee", e.target.value)}
                    placeholder="Nhập phí vận chuyển cơ bản"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thuế nhập khẩu (%)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                    value={importTaxPercentageInput}
                    onChange={(e) => handleChange("importTaxPercentage", e.target.value)}
                    placeholder="Nhập phần trăm thuế nhập khẩu"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
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
                    ? "Thêm cấu hình"
                    : "Lưu cập nhật"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}