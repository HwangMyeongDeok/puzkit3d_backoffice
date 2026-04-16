import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import {
  COUNTRY_CALLING_CODES,
  findCountryByName,
} from "@/mock/countryCallingCodes";
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
  estimatedDeliveryDays: 0,
};

function formatCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-US");
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

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function validateEstimatedDeliveryDays(value: number) {
  if (!Number.isInteger(value)) {
    return "Estimated delivery days must be an integer.";
  }

  if (value < 0 || value > 15) {
    return "Estimated delivery days must be between 0 and 15.";
  }

  return null;
}

function formatCurrencyVND(value: number) {
  return `${value.toLocaleString("en-US")} VND`;
}

function formatPercentage(value: number) {
  return `${value.toLocaleString("en-US")} %`;
}

export function ImportServiceConfigsPage() {
  const [configs, setConfigs] = useState<ImportServiceConfigDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<UpsertImportServiceConfigRequest>(initialForm);

  const [baseShippingFeeInput, setBaseShippingFeeInput] = useState("");
  const [importTaxPercentageInput, setImportTaxPercentageInput] = useState("");
  const [estimatedDeliveryDaysInput, setEstimatedDeliveryDaysInput] =
    useState("");
  const [estimatedDeliveryDaysError, setEstimatedDeliveryDaysError] = useState<
    string | null
  >(null);

  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "Business Manager";

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportServiceConfigs(1, 8, "", true);
      setConfigs(data.items);
    } catch (err) {
      console.error(err);
      setError("Unable to load import service configurations.");
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
    setEstimatedDeliveryDaysInput("");
    setEstimatedDeliveryDaysError(null);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedConfigId(null);
    setFormData(initialForm);
    setBaseShippingFeeInput("");
    setImportTaxPercentageInput("");
    setEstimatedDeliveryDaysInput("");
    setEstimatedDeliveryDaysError(null);
    setOpenModal(true);
  };

  const handleCountryInputChange = (value: string) => {
    const matched = findCountryByName(value);

    setFormData((prev) => ({
      ...prev,
      countryName: value,
      countryCode: matched?.code ?? "",
    }));
  };

  const handleCountrySelect = (option: SearchableSelectOption) => {
    setFormData((prev) => ({
      ...prev,
      countryName: option.label,
      countryCode: option.meta ?? "",
    }));
  };

  const openUpdateModal = (config: ImportServiceConfigDto) => {
    setModalMode("update");
    setSelectedConfigId(config.id);
    setFormData({
      baseShippingFee: config.baseShippingFee,
      countryCode: config.countryCode,
      countryName: config.countryName,
      importTaxPercentage: config.importTaxPercentage,
      estimatedDeliveryDays: config.estimatedDeliveryDays,
    });

    setBaseShippingFeeInput(config.baseShippingFee.toLocaleString("en-US"));
    setImportTaxPercentageInput(
      String(config.importTaxPercentage).replace(/,/g, ".")
    );
    setEstimatedDeliveryDaysInput(String(config.estimatedDeliveryDays));
    setEstimatedDeliveryDaysError(null);
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

    if (field === "estimatedDeliveryDays") {
      const sanitized = sanitizeIntegerInput(value).slice(0, 2);
      const parsedValue = sanitized === "" ? 0 : Number(sanitized);

      setEstimatedDeliveryDaysInput(sanitized);
      setFormData((prev) => ({
        ...prev,
        estimatedDeliveryDays: parsedValue,
      }));

      setEstimatedDeliveryDaysError(validateEstimatedDeliveryDays(parsedValue));
      return;
    }

    if (field === "countryName") {
      const selectedCountry = findCountryByName(value);

      setFormData((prev) => ({
        ...prev,
        countryName: value,
        countryCode: selectedCountry?.code ?? "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const deliveryDaysError = validateEstimatedDeliveryDays(
      formData.estimatedDeliveryDays
    );

    if (deliveryDaysError) {
      setEstimatedDeliveryDaysError(deliveryDaysError);
      toast.warning(deliveryDaysError);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        await createImportServiceConfig(formData);
        toast.success("Configuration created successfully.");
      } else {
        if (!selectedConfigId) return;
        await updateImportServiceConfig(selectedConfigId, formData);
        toast.success("Configuration updated successfully.");
      }

      closeModal();
      await fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(
        modalMode === "create"
          ? "Failed to create configuration."
          : "Failed to update configuration."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (config: ImportServiceConfigDto) => {
    try {
      if (config.isActive) {
        const confirmed = window.confirm(
          `Are you sure you want to disable the configuration for "${config.countryName}"?`
        );

        if (!confirmed) return;

        await disableImportServiceConfig(config.id);
        toast.success("Configuration disabled successfully.");
      } else {
        await enableImportServiceConfig(config.id);
        toast.success("Configuration enabled successfully.");
      }

      await fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error(
        config.isActive
          ? "Failed to disable configuration."
          : "Failed to enable configuration."
      );
    }
  };

  const countryOptions: SearchableSelectOption[] = COUNTRY_CALLING_CODES.map(
    (country) => ({
      label: country.name,
      value: country.name,
      meta: country.code,
      searchText: `${country.name} ${country.code}`,
    })
  );

  return (
    <div className="relative flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Import Service Configurations
        </h1>
        <p className="text-muted-foreground">
          Manage import service configurations.
        </p>
      </div>

      {isManager && (
        <div className="flex justify-start">
          <Button
            onClick={openCreateModal}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add configuration
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground">
          Loading configurations...
        </div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card
              key={config.id}
              className={`transition-all ${
                !config.isActive ? "opacity-50 grayscale" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="line-clamp-1">
                    {config.countryName}
                  </CardTitle>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                      config.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {config.isActive ? "Active" : "Disabled"}
                  </span>
                </div>

                <CardDescription className="line-clamp-2">
                  Country code: {config.countryCode}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Base shipping fee:</strong>{" "}
                    {formatCurrencyVND(config.baseShippingFee)}
                  </p>
                  <p>
                    <strong>Import tax:</strong>{" "}
                    {formatPercentage(config.importTaxPercentage)}
                  </p>
                  <p>
                    <strong>Updated at:</strong>{" "}
                    {new Date(config.updatedAt).toLocaleString("en-US")}
                  </p>
                </div>

                <div className="flex w-full gap-2 pt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => openUpdateModal(config)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Update
                  </Button>

                  <Button
                    variant={config.isActive ? "destructive" : "secondary"}
                    className="w-full"
                    onClick={() => handleToggleStatus(config)}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {config.isActive ? "Disable" : "Enable"}
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
                  {modalMode === "create"
                    ? "Add new configuration"
                    : "Update configuration"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {modalMode === "create"
                    ? "Enter the information to create a new import service configuration."
                    : "Edit the import service configuration details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Country name</label>
                <SearchableSelect
                  value={formData.countryName}
                  options={countryOptions}
                  placeholder="Type or select a country name"
                  emptyText="No country found"
                  onInputChange={handleCountryInputChange}
                  onSelect={handleCountrySelect}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Country code</label>
                <input
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-600 outline-none"
                  value={formData.countryCode}
                  readOnly
                  placeholder="Country code will be filled automatically"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Base shipping fee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-lg border px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-blue-500"
                    value={baseShippingFeeInput}
                    onChange={(e) =>
                      handleChange("baseShippingFee", e.target.value)
                    }
                    placeholder="Enter base shipping fee"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    VND
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Import tax (%)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                    value={importTaxPercentageInput}
                    onChange={(e) =>
                      handleChange("importTaxPercentage", e.target.value)
                    }
                    placeholder="Enter import tax percentage"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Estimated delivery days
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className={`w-full rounded-lg border px-3 py-2 pr-14 outline-none focus:ring-2 ${
                      estimatedDeliveryDaysError
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    value={estimatedDeliveryDaysInput}
                    onChange={(e) =>
                      handleChange("estimatedDeliveryDays", e.target.value)
                    }
                    onBlur={() =>
                      setEstimatedDeliveryDaysError(
                        validateEstimatedDeliveryDays(
                          formData.estimatedDeliveryDays
                        )
                      )
                    }
                    placeholder="Enter a value from 0 to 15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    days
                  </span>
                </div>

                {estimatedDeliveryDaysError ? (
                  <p className="text-sm text-red-500">
                    {estimatedDeliveryDaysError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Valid range: 0 to 15 days.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Processing..."
                  : modalMode === "create"
                  ? "Add configuration"
                  : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}