import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Loader2,
  Sparkles,
  Layers,
  Puzzle,
  Wrench,
  Gauge,
  Hash,
  Power,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

import { useRequirements } from "@/hooks/useCustomDesignRequirementQueries";
import {
  useTopics,
  useMaterials,
  useAssemblyMethods,
  useCapabilities,
} from "@/hooks/useMasterDataQueries";
import {
  type CustomDesignRequirement,
  type UpsertRequirementPayload,
} from "@/types/types";
import { extractErrorMessage } from "@/lib/error-handler";

interface RequirementFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReq: CustomDesignRequirement | null;
}

// ─── Difficulty config ───
const DIFFICULTY_OPTIONS = [
  {
    value: "Basic",
    label: "Cơ bản",
    color: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  {
    value: "Intermediate",
    label: "Trung cấp",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "Advanced",
    label: "Nâng cao",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
];

export const RequirementFormSheet = ({
  isOpen,
  onOpenChange,
  selectedReq,
}: RequirementFormSheetProps) => {
  const { useCreateRequirement, useUpdateRequirement } = useRequirements();
  const createMutation = useCreateRequirement();
  const updateMutation = useUpdateRequirement();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ─── Fetch master data ───
  const { data: topicsData = [], isLoading: loadingTopics } = useTopics();
  const { data: materialsData = [], isLoading: loadingMaterials } =
    useMaterials();
  const { data: assemblyMethodsData = [], isLoading: loadingAssembly } =
    useAssemblyMethods();
  const { data: capabilitiesData = [], isLoading: loadingCapabilities } =
    useCapabilities();

  const isMasterDataLoading =
    loadingTopics || loadingMaterials || loadingAssembly || loadingCapabilities;

  // ─── Capability dropdown open state ───
  const [capabilityOpen, setCapabilityOpen] = useState(false);

  // ─── Form ───
  const { register, handleSubmit, reset, setValue, watch, control } =
    useForm<UpsertRequirementPayload>({
      defaultValues: {
        isActive: true,
        difficulty: "Intermediate",
        minPartQuantity: 1,
        maxPartQuantity: 10,
        capabilityIds: [],
      },
    });

  const isActiveValue = watch("isActive");
  const capabilityIdsValue = watch("capabilityIds") || [];
  const difficultyValue = watch("difficulty");

  // ─── Reset on open / selectedReq change ───
  useEffect(() => {
    if (isOpen) {
      if (selectedReq) {
        reset({
          topicId: selectedReq.topicId,
          materialId: selectedReq.materialId,
          assemblyMethodId: selectedReq.assemblyMethodId,
          difficulty: selectedReq.difficulty,
          minPartQuantity: selectedReq.minPartQuantity,
          maxPartQuantity: selectedReq.maxPartQuantity,
          isActive: selectedReq.isActive,
          capabilityIds: selectedReq.capabilityIds || [],
        });
      } else {
        reset({
          isActive: true,
          difficulty: "Intermediate",
          minPartQuantity: 1,
          maxPartQuantity: 10,
          capabilityIds: [],
          topicId: "",
          materialId: "",
          assemblyMethodId: "",
        });
      }
      setCapabilityOpen(false);
    }
  }, [selectedReq, reset, isOpen]);

  // ─── Toggle capability ───
  const toggleCapability = (id: string) => {
    const current = capabilityIdsValue || [];
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    setValue("capabilityIds", next, { shouldDirty: true });
  };

  const removeCapability = (id: string) => {
    const current = capabilityIdsValue || [];
    setValue(
      "capabilityIds",
      current.filter((c) => c !== id),
      { shouldDirty: true }
    );
  };

  // ─── Submit ───
  const onSubmit = async (data: UpsertRequirementPayload) => {
    const promise = selectedReq
      ? (updateMutation.mutateAsync({
          id: selectedReq.id,
          payload: data,
        }) as Promise<unknown>)
      : (createMutation.mutateAsync(data) as Promise<unknown>);

    toast.promise(promise, {
      loading: "Đang xử lý dữ liệu...",
      success: () => {
        onOpenChange(false);
        return selectedReq ? "Cập nhật thành công!" : "Tạo mới thành công!";
      },
      error: (err: unknown) => extractErrorMessage(err, "Có lỗi xảy ra từ máy chủ, vui lòng thử lại!"),
    });
  };

  // ─── Helpers ───
  const getDifficultyConfig = (val: string) =>
    DIFFICULTY_OPTIONS.find((d) => d.value === val) || DIFFICULTY_OPTIONS[1];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (isSubmitting) return; // Prevent closing while submitting
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl border-slate-200/80 shadow-2xl">
        {/* ─── Header ─── */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          <DialogHeader className="relative z-10 mb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {selectedReq
                    ? "Cập nhật Requirement"
                    : "Thêm mới Requirement"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-0.5">
                  {selectedReq
                    ? `Chỉnh sửa thông tin cho mã ${selectedReq.code}`
                    : "Cấu hình thông tin kỹ thuật cho mẫu thiết kế mới"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Status badge */}
          {selectedReq && (
            <div className="relative z-10 mt-4 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 border ${
                  selectedReq.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                {selectedReq.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                {selectedReq.code}
              </span>
            </div>
          )}
        </div>

        {/* ─── Content body ─── */}
        <ScrollArea className="flex-1 max-h-[calc(92vh-200px)]">
          {isMasterDataLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500">
                Đang tải dữ liệu danh mục...
              </p>
            </div>
          ) : (
            <form
              id="requirement-form"
              onSubmit={handleSubmit(onSubmit, (errors) => {
                const missing = Object.keys(errors).join(", ");
                toast.error(`Form chưa hợp lệ. Vui lòng kiểm tra các trường: ${missing}`);
              })}
              className="px-8 py-6 space-y-8"
            >
              {/* ─── Section: Phân loại kỹ thuật ─── */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Phân loại kỹ thuật
                  </h3>
                </div>
                <Separator className="bg-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Topic */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Puzzle className="h-3.5 w-3.5 text-slate-400" />
                      Chủ đề
                      <span className="text-red-400">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="topicId"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={topicsData.length === 0}
                        >
                          <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30">
                            <SelectValue placeholder={topicsData.length === 0 ? "Chưa có chủ đề" : "Chọn chủ đề..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {topicsData.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                <span className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {topic.name}
                                  </span>
                                  {topic.slug && (
                                    <span className="text-xs text-slate-400">
                                      ({topic.slug})
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Material */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      Vật liệu
                      <span className="text-red-400">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="materialId"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={materialsData.length === 0}
                        >
                          <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30">
                            <SelectValue placeholder={materialsData.length === 0 ? "Chưa có vật liệu" : "Chọn vật liệu..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {materialsData.map((mat) => (
                              <SelectItem key={mat.id} value={mat.id}>
                                <span className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {mat.name}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Assembly Method — full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-slate-400" />
                      Phương pháp lắp ráp
                      <span className="text-red-400">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="assemblyMethodId"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={assemblyMethodsData.length === 0}
                        >
                          <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30">
                            <SelectValue placeholder={assemblyMethodsData.length === 0 ? "Chưa có phương pháp" : "Chọn phương pháp lắp ráp..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {assemblyMethodsData.map((am) => (
                              <SelectItem key={am.id} value={am.id}>
                                <span className="flex items-center gap-2">
                                  <span className="font-medium">{am.name}</span>
                                  {am.description && (
                                    <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                      — {am.description}
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Section: Khả năng (Multi-select) ─── */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Khả năng yêu cầu
                  </h3>
                  {capabilityIdsValue.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs bg-violet-50 text-violet-700"
                    >
                      {capabilityIdsValue.length} đã chọn
                    </Badge>
                  )}
                </div>
                <Separator className="bg-slate-100" />

                {/* Selected capabilities tags */}
                {capabilityIdsValue.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {capabilityIdsValue.map((id) => {
                      const cap = capabilitiesData.find((c) => c.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="outline"
                          className="pl-2.5 pr-1.5 py-1 bg-white border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors gap-1.5 text-xs font-medium"
                        >
                          {cap?.name || id}
                          <button
                            type="button"
                            onClick={() => removeCapability(id)}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-violet-200/60 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown toggle */}
                <button
                  type="button"
                  onClick={() => setCapabilityOpen(!capabilityOpen)}
                  className="w-full flex items-center justify-between h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg text-sm hover:border-slate-300 transition-colors"
                >
                  <span className="text-slate-500">
                    {capabilityIdsValue.length === 0
                      ? "Chọn các khả năng..."
                      : `${capabilityIdsValue.length} khả năng đã chọn`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      capabilityOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown list */}
                {capabilityOpen && (
                  <div className="border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <ScrollArea className="max-h-48">
                      <div className="p-2 space-y-0.5">
                        {capabilitiesData.map((cap) => {
                          const isSelected = capabilityIdsValue.includes(
                            cap.id
                          );
                          return (
                            <label
                              key={cap.id}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-violet-50 border border-violet-100"
                                  : "hover:bg-slate-50 border border-transparent"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCapability(cap.id)}
                                className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">
                                  {cap.name}
                                </p>
                                {cap.description && (
                                  <p className="text-xs text-slate-400 truncate">
                                    {cap.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-violet-600 shrink-0" />
                              )}
                            </label>
                          );
                        })}
                        {capabilitiesData.length === 0 && (
                          <p className="text-center text-sm text-slate-400 py-4">
                            Không có dữ liệu
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* ─── Section: Thông số ─── */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Thông số & Cấu hình
                  </h3>
                </div>
                <Separator className="bg-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-slate-400" />
                      Độ khó
                    </Label>
                    <Controller
                      control={control}
                      name="difficulty"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30">
                            <SelectValue placeholder="Chọn độ khó" />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`h-2 w-2 rounded-full ${opt.dot}`}
                                  />
                                  <span className="font-medium">
                                    {opt.label}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {/* Visual difficulty indicator */}
                    {difficultyValue && (
                      <div className="flex gap-1 pt-0.5">
                        {DIFFICULTY_OPTIONS.map((opt, idx) => (
                          <div
                            key={opt.value}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              DIFFICULTY_OPTIONS.findIndex(
                                (d) => d.value === difficultyValue
                              ) >= idx
                                ? getDifficultyConfig(difficultyValue).dot
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Min Part */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="minPart"
                      className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                    >
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      Min Parts
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="minPart"
                      type="number"
                      className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30"
                      {...register("minPartQuantity", { valueAsNumber: true, required: true, min: 1 })}
                    />
                  </div>

                  {/* Max Part */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxPart"
                      className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                    >
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      Max Parts
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="maxPart"
                      type="number"
                      className="h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 transition-colors focus:ring-blue-500/30"
                      {...register("maxPartQuantity", { 
                        valueAsNumber: true, 
                        required: true,
                        validate: (val) => val >= watch("minPartQuantity") || "Max Parts phải lớn hơn hoặc bằng Min Parts"
                      })}
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isActiveValue
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Trạng thái hoạt động
                      </p>
                      <p className="text-xs text-slate-500">
                        {isActiveValue
                          ? "Requirement này đang được kích hoạt"
                          : "Requirement này đang bị tắt"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActiveValue}
                    onCheckedChange={(val) => setValue("isActive", val)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </div>
            </form>
          )}
        </ScrollArea>

        {/* ─── Footer ─── */}
        <div className="border-t border-slate-200 bg-slate-50/50">
          <DialogFooter className="px-8 py-4 gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 px-6 border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="requirement-form"
              disabled={isSubmitting || isMasterDataLoading}
              className="h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md shadow-blue-600/25 transition-all hover:shadow-lg hover:shadow-blue-600/30"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedReq ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};