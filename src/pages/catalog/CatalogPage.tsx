import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Boxes,
  Layers3,
  Package,
  Plus,
  RefreshCcw,
  Shapes,
  Pencil,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  getCatalogList,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getAllTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  type CatalogItem,
  type CatalogResource,
  type PagedResponse,
  type TopicItem,
  type TopicPayload,
} from '@/services/catalogApi';

type FormMode = 'create' | 'edit';

type CatalogFormState = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  parentId: string;
};

const PAGE_SIZE = 8;

const emptyForm: CatalogFormState = {
  id: '',
  name: '',
  slug: '',
  description: '',
  isActive: true,
  parentId: '',
};

const resourceMeta: Record<
  CatalogResource,
  {
    title: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  'assembly-methods': {
    title: 'Assembly Methods',
    description: 'Quản lý phương thức lắp ráp',
    icon: Boxes,
  },
  capabilities: {
    title: 'Capabilities',
    description: 'Quản lý tính năng / khả năng',
    icon: Layers3,
  },
  materials: {
    title: 'Materials',
    description: 'Quản lý vật liệu',
    icon: Package,
  },
  topics: {
    title: 'Topics',
    description: 'Quản lý chủ đề và topic cha/con',
    icon: Shapes,
  },
};

function isTopicItem(item: CatalogItem): item is TopicItem {
  return 'parentId' in item;
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
}

export function CatalogPage() {
  const [selectedResource, setSelectedResource] =
    useState<CatalogResource>('assembly-methods');
  const [pageNumber, setPageNumber] = useState(1);
  const [response, setResponse] = useState<PagedResponse<CatalogItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [topicOptions, setTopicOptions] = useState<TopicItem[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [form, setForm] = useState<CatalogFormState>(emptyForm);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);

  const currentMeta = resourceMeta[selectedResource];

  const parentTopicOptions = useMemo(() => {
    return topicOptions.filter(
      (topic) => !topic.parentId && topic.id !== form.id
    );
  }, [topicOptions, form.id]);

  const fetchList = async () => {
    try {
      setLoading(true);

      const data =
        selectedResource === "topics"
          ? await getCatalogList<TopicItem>("topics", pageNumber, PAGE_SIZE, true)
          : await getCatalogList<CatalogItem>(selectedResource, pageNumber, PAGE_SIZE, true);

      setResponse(data as PagedResponse<CatalogItem>);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không tải được dữ liệu catalog";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicOptions = async () => {
    try {
      const data = await getAllTopics(true);
      setTopicOptions(data.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không tải được danh sách topic";
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchList();
  }, [selectedResource, pageNumber]);

  useEffect(() => {
    if (selectedResource === 'topics') {
      fetchTopicOptions();
    }
  }, [selectedResource]);

  const openCreateModal = async () => {
    if (selectedResource === 'topics') {
      await fetchTopicOptions();
    }
    setFormMode('create');
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = async (item: CatalogItem) => {
    if (selectedResource === 'topics') {
      await fetchTopicOptions();
    }

    setFormMode('edit');
    setForm({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      isActive: item.isActive,
      parentId: isTopicItem(item) ? item.parentId ?? '' : '',
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (item: CatalogItem) => {
    setDeleteTarget({
      id: item.id,
      name: item.name,
      slug: item.slug,
    });
    setIsDeleteOpen(true);
  };

  const handleFormChange = (
    key: keyof CatalogFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Tên không được để trống');
      return false;
    }
    if (!form.slug.trim()) {
      toast.error('Slug không được để trống');
      return false;
    }
    if (!form.description.trim()) {
      toast.error('Mô tả không được để trống');
      return false;
    }
    if (formMode === 'edit' && !form.id.trim()) {
      toast.error('ID không được để trống');
      return false;
    }
    if (selectedResource === 'topics' && form.parentId && form.parentId === form.id) {
      toast.error('Topic không thể chọn chính nó làm parent');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (selectedResource === "topics") {
        const payload: TopicPayload = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
          parentId: form.parentId.trim() || null,
        };

        if (formMode === "create") {
          const newId = await createTopic(payload);
          toast.success(`Tạo topic thành công. ID: ${newId}`);
        } else {
          await updateTopic(form.id.trim(), payload);
          toast.success("Cập nhật topic thành công");
        }

        await fetchTopicOptions();
      } else {
        const payload = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        };

        if (formMode === "create") {
          const newId = await createCatalogItem(selectedResource, payload);
          toast.success(`Tạo ${currentMeta.title} thành công. ID: ${newId}`);
        } else {
          await updateCatalogItem(selectedResource, form.id.trim(), payload);
          toast.success(`Cập nhật ${currentMeta.title} thành công`);
        }
      }

      setIsFormOpen(false);
      setForm(emptyForm);
      await fetchList();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không lưu được dữ liệu';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const normalizedId = deleteTarget?.id.trim() || '';

    if (!normalizedId) {
      toast.error('ID xóa không được để trống');
      return;
    }

    try {
      setSubmitting(true);

      if (selectedResource === "topics") {
        const allTopics = await getAllTopics(true);
        const hasChildren = allTopics.items.some(
          (topic) => topic.parentId === normalizedId
        );

        if (hasChildren) {
          toast.error(
            "Không thể xóa topic cha vì đang có topic con liên kết. Hãy xóa hoặc chuyển topic con trước."
          );
          return;
        }

        await deleteTopic(normalizedId);
      } else {
        await deleteCatalogItem(selectedResource, normalizedId);
      }

      toast.success(`Xóa ${currentMeta.title} thành công`);
      setIsDeleteOpen(false);
      setDeleteTarget(null);

      if (selectedResource === "topics") {
        await fetchTopicOptions();
      }

      await fetchList();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không xóa được dữ liệu";

      if (
        selectedResource === "topics" &&
        /child|children|reference|constraint|liên kết|related/i.test(message)
      ) {
        toast.error(
          "Không thể xóa topic cha vì đang có topic con liên kết. Hãy xóa hoặc chuyển topic con trước."
        );
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const findParentName = (parentId: string | null) => {
    if (!parentId) return 'Topic gốc';
    const found = topicOptions.find((topic) => topic.id === parentId);
    return found ? found.name : parentId;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý Assembly Methods, Capabilities, Materials và Topics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(resourceMeta) as CatalogResource[]).map((resource) => {
          const meta = resourceMeta[resource];
          const Icon = meta.icon;
          const isActive = selectedResource === resource;

          return (
            <button
              key={resource}
              type="button"
              onClick={() => {
                setSelectedResource(resource);
                setPageNumber(1);
              }}
              className={`rounded-2xl border p-5 text-left transition ${isActive
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">{meta.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{currentMeta.title}</h2>
            <p className="text-sm text-muted-foreground">
              {currentMeta.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchList} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : response?.items?.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {response.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Slug: {item.slug}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {item.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>

                  {selectedResource === 'topics' && isTopicItem(item) && (
                    <p className="mb-2 text-sm">
                      <span className="font-semibold">Parent:</span>{' '}
                      {findParentName(item.parentId)}
                    </p>
                  )}

                  <p className="mb-2 text-sm">
                    <span className="font-semibold">ID:</span> {item.id}
                  </p>

                  <p className="mb-2 text-sm">
                    <span className="font-semibold">Mô tả:</span>{' '}
                    {item.description}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">Tạo lúc:</span>{' '}
                    {formatDate(item.createdAt)}
                  </p>

                  <p className="mb-5 text-sm">
                    <span className="font-semibold">Cập nhật lúc:</span>{' '}
                    {formatDate(item.updatedAt)}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => openEditModal(item)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Cập nhật
                    </Button>

                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openDeleteModal(item)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {response.pageNumber}/{response.totalPages} • Tổng{' '}
                {response.totalCount} bản ghi
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!response.hasPreviousPage}
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  disabled={!response.hasNextPage}
                  onClick={() => setPageNumber((prev) => prev + 1)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Chưa có dữ liệu.
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-3xl font-bold">
                  {formMode === 'create' ? 'Thêm mới' : 'Cập nhật'}{' '}
                  {currentMeta.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formMode === 'create'
                    ? 'Nhập thông tin để tạo mới.'
                    : 'Cập nhật thông tin theo ID.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {formMode === 'edit' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">ID</label>
                  <input
                    value={form.id}
                    onChange={(e) => handleFormChange('id', e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                    placeholder="Nhập ID"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Nhập name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Nhập slug"
                />
              </div>

              {selectedResource === 'topics' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Parent Topic
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) => handleFormChange('parentId', e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="">Không chọn parent</option>
                    {parentTopicOptions.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name} - {topic.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="min-h-[120px] w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                  placeholder="Nhập description"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  isActive
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? 'Đang xử lý...'
                  : formMode === 'create'
                    ? 'Thêm mới'
                    : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold">Xóa {currentMeta.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nhập hoặc kiểm tra lại ID trước khi xóa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Xác nhận xóa mục sau:
                </p>

                <p className="text-sm">
                  <span className="font-semibold">Tên:</span> {deleteTarget?.name || '-'}
                </p>

                <p className="mt-1 text-sm">
                  <span className="font-semibold">Slug:</span> {deleteTarget?.slug || '-'}
                </p>
              </div>

              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-semibold text-destructive">
                  Bạn có chắc chắn muốn xóa "{deleteTarget?.name || 'mục này'}" không?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thao tác này không thể hoàn tác.
                </p>
              </div>

              {selectedResource === 'topics' && (
                <p className="text-sm text-amber-600">
                  Với topic: FE sẽ chặn xóa nếu đây là topic cha đang có topic con liên kết.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Đang xóa...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}