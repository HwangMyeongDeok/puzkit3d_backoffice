// File: src/pages/inventory/components/ProductRow.tsx
import React from "react";
import { ChevronRight, ChevronDown, Pencil, Trash2, Layers, Clock } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpandedVariantTable } from "@/components/inventory/Expandedvarianttable";
// Import type chuẩn từ project của ông
import type { InstockProductDto } from "@/types/types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

// Giả sử Type độ khó của ông giống như này
export type DifficultyLevel = "Basic" | "Intermediate" | "Advanced" | "Expert";

interface ProductRowProps {
  product: InstockProductDto;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit?: (product: InstockProductDto) => void; // Có thể để option
  onDelete?: (product: InstockProductDto) => void; // Có thể để option
}

// ─── INTERNAL HELPERS ───────────────────────────────────────────────────────

const difficultyConfig: Record<DifficultyLevel, { label: string; className: string }> = {
  Basic: {
    label: "Cơ bản",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  Intermediate: {
    label: "Trung cấp",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  Advanced: {
    label: "Nâng cao",
    className: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  Expert: {
    label: "Chuyên gia",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

const formatBuildTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}g ${m}p` : `${h} giờ`;
};

function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  // Lấy config dựa trên level, nếu không tìm thấy thì dùng default
  const config = difficultyConfig[level] || {
    label: level,
    className: "border-muted-foreground/30 text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}


export function ProductRow({ product, isExpanded, onToggle, onEdit, onDelete }: ProductRowProps) {
  return (
    <React.Fragment>
      <TableRow
        className="group cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => onToggle(product.id)}
      >
        <TableCell className="w-10 pl-4 pr-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(product.id);
            }}
            aria-label={isExpanded ? "Thu gọn biến thể" : "Mở rộng biến thể"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>

        {/* 2. Sản phẩm (Thumbnail + Tên + Mã) */}
        <TableCell className="py-2.5">
          <div className="flex items-center gap-3">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="h-9 w-9 rounded-md object-cover border border-border/50 flex-shrink-0"
              />
            ) : (
              // Placeholder nếu không có ảnh
              <div className="h-9 w-9 rounded-md bg-muted flex-shrink-0 border border-dashed border-muted-foreground/20" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]" title={product.name}>
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
            </div>
          </div>
        </TableCell>

        {/* 3. Số mảnh */}
        <TableCell className="py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-foreground">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="tabular-nums">
              {product.totalPieceCount.toLocaleString("vi-VN")}
            </span>
          </div>
        </TableCell>

        {/* 4. Thời gian lắp ráp */}
        <TableCell className="py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatBuildTime(product.estimatedBuildTime)}</span>
          </div>
        </TableCell>

        {/* 5. Độ khó */}
        <TableCell className="py-2.5">
          {/* Dùng component DifficultyBadge định nghĩa ngay phía trên */}
          <DifficultyBadge level={product.difficultLevel as DifficultyLevel} />
        </TableCell>

        {/* 6. Thao tác */}
        <TableCell className="py-2.5 text-right pr-4">
          <div
            className="flex items-center justify-end gap-1"
            // Ngăn click lan ra TableRow cha
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onEdit?.(product)}
              aria-label="Chỉnh sửa sản phẩm"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(product)}
              aria-label="Xóa sản phẩm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* ── HIỆN BẢNG CON KHI CLICK (Dòng mở rộng) ── */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent bg-muted/10">
          <TableCell
            // colSpan=6 vì bảng cha có đúng 6 cột
            colSpan={6}
            className="p-0 border-b border-border/50"
          >
            {/* Nhúng component bảng con của ông vào đây */}
            <ExpandedVariantTable productId={product.id} />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}