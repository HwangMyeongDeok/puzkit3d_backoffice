import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Power, Search } from "lucide-react";
import { toast } from "sonner";

import {
  disablePartnerProduct,
  enablePartnerProduct,
  getPartnerProducts,
} from "@/services/partnerProductApi";
import { getPartners } from "@/services/partnerApi";
import { resolveAssetUrl } from "@/lib/media";

import type { PartnerDto } from "@/types/types";
import type { PartnerProductDto } from "@/types/types";

function formatCurrencyVND(value: number) {
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

export function PartnerProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<PartnerProductDto[]>([]);
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  const partnerMap = useMemo(() => {
    return new Map(partners.map((partner) => [partner.id, partner]));
  }, [partners]);

  const fetchData = async (keyword = searchTerm, partnerId = selectedPartnerId) => {
    try {
      setLoading(true);

      const [productData, partnerData] = await Promise.all([
        getPartnerProducts(1, 20, keyword, partnerId),
        getPartners(1, 100),
      ]);

      setProducts(productData.items);
      setPartners(partnerData.items);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sản phẩm đối tác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData("", "");
  }, []);

  const handleSearch = async () => {
    await fetchData(searchTerm, selectedPartnerId);
  };

  const handleToggleStatus = async (product: PartnerProductDto) => {
    try {
      if (product.isActive) {
        const confirmed = window.confirm(
          `Bạn có chắc muốn vô hiệu hóa sản phẩm "${product.name}" không?`
        );
        if (!confirmed) return;

        await disablePartnerProduct(product.id);
        toast.success("Vô hiệu hóa sản phẩm thành công.");
      } else {
        await enablePartnerProduct(product.id);
        toast.success("Kích hoạt sản phẩm thành công.");
      }

      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        product.isActive
          ? "Vô hiệu hóa sản phẩm thất bại."
          : "Kích hoạt sản phẩm thất bại."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sản phẩm đối tác</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách sản phẩm của các đối tác.
          </p>
        </div>

        <Button
          onClick={() => navigate("/partner-products/new")}
          className="inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px_120px]">
          <input
            className="w-full rounded-lg border px-3 py-2 outline-none"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="w-full rounded-lg border px-3 py-2 outline-none"
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
          >
            <option value="">Tất cả đối tác</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>

          <Button onClick={handleSearch} className="inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tìm
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="grid grid-cols-[120px_220px_minmax(240px,1fr)_150px_90px_220px] gap-4 border-b bg-slate-50 px-4 py-3 text-sm font-semibold">
          <div>Ảnh</div>
          <div>Sản phẩm</div>
          <div>Mô tả</div>
          <div>Giá tham chiếu</div>
          <div>Số lượng</div>
          <div>Thao tác</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
        ) : products.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            Không có sản phẩm đối tác nào.
          </div>
        ) : (
          products.map((product) => {
            const partner = partnerMap.get(product.partnerId);
            const thumbnailSrc = resolveAssetUrl(product.thumbnailUrl);

            return (
              <div
                key={product.id}
                className={`grid grid-cols-[120px_220px_minmax(240px,1fr)_150px_90px_220px] gap-4 border-b px-4 py-4 ${
                  !product.isActive ? "opacity-50 grayscale" : ""
                }`}
              >
                <div className="flex items-start">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={product.name}
                      className="h-20 w-20 rounded-lg border object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-slate-50 text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <button
                    className="text-left"
                    onClick={() => navigate(`/partner-products/${product.id}/edit`)}
                  >
                    <p className="font-semibold hover:underline">{product.name}</p>
                  </button>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Đối tác: {partner?.name ?? product.partnerId}
                  </p>
                  <p className="text-sm text-muted-foreground">Slug: {product.slug}</p>
                </div>

                <div className="min-w-0">
                  <p className="whitespace-normal break-words text-sm leading-6 text-slate-700">
                    {product.description || "—"}
                  </p>
                </div>

                <div className="flex items-start text-sm font-medium">
                  {formatCurrencyVND(product.referencePrice)}
                </div>

                <div className="flex items-start text-sm">{product.quantity}</div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    onClick={() => navigate(`/partner-products/${product.id}/edit`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Cập nhật
                  </Button>

                  <Button
                    variant={product.isActive ? "destructive" : "secondary"}
                    className="whitespace-nowrap"
                    onClick={() => handleToggleStatus(product)}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {product.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}