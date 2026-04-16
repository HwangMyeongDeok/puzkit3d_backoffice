import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Power, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getPartners,
  createPartner,
  updatePartner,
  disablePartner,
  enablePartner,
} from "@/services/partnerApi";
import { getImportServiceConfigs } from "@/services/importServiceConfigApi";
import type {
  ImportServiceConfigDto,
  PartnerDto,
  UpsertPartnerRequest,
} from "@/types/types";

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

function slugifyFromName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PartnerApprovals() {
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ImportServiceConfigDto[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "Business Manager";

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<UpsertPartnerRequest>(initialForm);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    contactEmail?: string;
    contactPhone?: string;
    importServiceConfigId?: string;
  }>({});

  const serviceConfigMap = useMemo(() => {
    return new Map(serviceConfigs.map((item) => [item.id, item]));
  }, [serviceConfigs]);

  const selectedCountryCode = useMemo(() => {
    if (!formData.importServiceConfigId) return "";
    return (
      serviceConfigMap.get(formData.importServiceConfigId)?.countryCode ?? ""
    );
  }, [formData.importServiceConfigId, serviceConfigMap]);

  const selectableConfigs = useMemo(() => {
    const activeConfigs = serviceConfigs.filter((item) => item.isActive);

    if (!formData.importServiceConfigId) {
      return activeConfigs;
    }

    const selectedConfig = serviceConfigMap.get(formData.importServiceConfigId);

    if (
      selectedConfig &&
      !selectedConfig.isActive &&
      !activeConfigs.some((item) => item.id === selectedConfig.id)
    ) {
      return [selectedConfig, ...activeConfigs];
    }

    return activeConfigs;
  }, [formData.importServiceConfigId, serviceConfigs, serviceConfigMap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [partnerData, configData] = await Promise.all([
        getPartners(1, 8, true),
        getImportServiceConfigs(1, 100, "", true),
      ]);

      setPartners(partnerData.items);
      setServiceConfigs(configData.items);
    } catch (err) {
      console.error(err);
      setError("Unable to load partners.");
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
    setFieldErrors({});
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
    setFieldErrors({});
    setOpenModal(true);
  };

  const handleChange = (field: keyof UpsertPartnerRequest, value: string) => {
    if (field === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        name: undefined,
      }));
      return;
    }

    if (field === "contactPhone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        contactPhone: digitsOnly,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        contactPhone: undefined,
      }));
      return;
    }

    if (field === "slug") {
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

  const handleNameBlur = () => {
    setFormData((prev) => ({
      ...prev,
      slug: slugifyFromName(prev.name),
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
      errors.importServiceConfigId =
        "Please select an import service configuration.";
    }

    if (!normalizedName) {
      errors.name = "Please enter the partner name.";
    } else {
      const duplicatedName = partners.some(
        (partner) =>
          partner.id !== selectedPartnerId &&
          partner.name.trim().toLowerCase() === normalizedName
      );

      if (duplicatedName) {
        errors.name = "Partner name already exists.";
      }
    }

    if (!normalizedEmail) {
      errors.contactEmail = "Please enter an email address.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        errors.contactEmail = "Invalid email format.";
      } else {
        const duplicatedEmail = partners.some(
          (partner) =>
            partner.id !== selectedPartnerId &&
            partner.contactEmail.trim().toLowerCase() === normalizedEmail
        );

        if (duplicatedEmail) {
          errors.contactEmail = "Email already exists.";
        }
      }
    }

    if (!normalizedPhone) {
      errors.contactPhone = "Please enter a phone number.";
    } else if (!/^\d{10}$/.test(normalizedPhone)) {
      errors.contactPhone = "Phone number must contain exactly 10 digits.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    const generatedSlug = slugifyFromName(formData.name);

    const payload: UpsertPartnerRequest = {
      ...formData,
      slug: generatedSlug,
      contactPhone: formData.contactPhone.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      slug: generatedSlug,
    }));

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        await createPartner(payload);
        toast.success("Partner created successfully.");
      } else {
        if (!selectedPartnerId) return;
        await updatePartner(selectedPartnerId, payload);
        toast.success("Partner updated successfully.");
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(
        modalMode === "create"
          ? "Failed to create partner."
          : "Failed to update partner."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (partner: PartnerDto) => {
    try {
      if (partner.isActive) {
        const confirmed = window.confirm(
          `Are you sure you want to disable partner "${partner.name}"?`
        );
        if (!confirmed) return;

        await disablePartner(partner.id);
        toast.success("Partner disabled successfully.");
      } else {
        await enablePartner(partner.id);
        toast.success("Partner enabled successfully.");
      }

      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(
        partner.isActive
          ? "Failed to disable partner."
          : "Failed to enable partner."
      );
    }
  };

  return (
    <div className="relative flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Manager</h1>
        <p className="text-muted-foreground">
          Manage partners and their corresponding import service configuration.
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
            Add partner
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground">Loading partners...</div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const matchedConfig = serviceConfigMap.get(
              partner.importServiceConfigId
            );

            return (
              <Card
                key={partner.id}
                className={`transition-all ${
                  !partner.isActive ? "opacity-50 grayscale" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="line-clamp-1">
                      {partner.name}
                    </CardTitle>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        partner.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {partner.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <CardDescription className="line-clamp-2">
                    {partner.description || "No description"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Email:</strong> {partner.contactEmail}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {matchedConfig?.countryCode
                        ? `${matchedConfig.countryCode} ${partner.contactPhone}`
                        : partner.contactPhone}
                    </p>
                    <p>
                      <strong>Address:</strong> {partner.address}
                    </p>
                    <p>
                      <strong>Slug:</strong> {partner.slug}
                    </p>
                    <p>
                      <strong>Import service config:</strong>{" "}
                      {matchedConfig
                        ? buildImportServiceLabel(matchedConfig)
                        : partner.importServiceConfigId}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 pt-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => openUpdateModal(partner)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Update
                    </Button>

                    <Button
                      variant={partner.isActive ? "destructive" : "secondary"}
                      className="w-full"
                      onClick={() => handleToggleStatus(partner)}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {partner.isActive ? "Disable" : "Enable"}
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
                  {modalMode === "create"
                    ? "Add new partner"
                    : "Update partner"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {modalMode === "create"
                    ? "Enter the information to create a new partner."
                    : "Edit the partner information."}
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

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Partner name</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Enter partner name"
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-500">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact email</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      handleChange("contactEmail", e.target.value)
                    }
                    placeholder="Enter contact email"
                  />
                  {fieldErrors.contactEmail && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.contactEmail}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone number</label>

                  <div className="flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="border-r bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {selectedCountryCode || "--"}
                    </div>
                    <input
                      className="w-full rounded-r-lg px-3 py-2 outline-none"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        handleChange("contactPhone", e.target.value)
                      }
                      placeholder="Enter 10-digit phone number"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Country code is displayed separately. Only the 10-digit local
                    phone number will be sent to the backend.
                  </p>

                  {fieldErrors.contactPhone && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.contactPhone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <input
                    className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-600 outline-none"
                    value={formData.slug}
                    readOnly
                    placeholder="Slug is generated automatically"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter description"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Import service configuration
                  </label>

                  <select
                    className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.importServiceConfigId}
                    onChange={(e) =>
                      handleChange("importServiceConfigId", e.target.value)
                    }
                  >
                    <option value="">
                      -- Select an import service configuration --
                    </option>

                    {selectableConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {buildImportServiceLabel(config)}
                        {!config.isActive ? " - Inactive" : ""}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.importServiceConfigId && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.importServiceConfigId}
                    </p>
                  )}
                </div>
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
                  ? "Add partner"
                  : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}