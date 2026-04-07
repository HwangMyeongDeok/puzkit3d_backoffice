import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SearchableSelectOption = {
  label: string;
  value: string;
  meta?: string;
  searchText?: string;
};

type Props = {
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyText?: string;
  onInputChange?: (value: string) => void;
  onSelect: (option: SearchableSelectOption) => void;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  options,
  placeholder = "Nhập hoặc chọn",
  emptyText = "Không có dữ liệu",
  onInputChange,
  onSelect,
  disabled = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) => {
      const haystack = `${option.label} ${option.meta ?? ""} ${option.searchText ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const nextValue = e.target.value;
            setQuery(nextValue);
            setOpen(true);
            onInputChange?.(nextValue);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const selected = value === option.label || value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setQuery(option.label);
                      onSelect(option);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{option.label}</p>
                      {option.meta ? (
                        <p className="truncate text-xs text-slate-500">{option.meta}</p>
                      ) : null}
                    </div>

                    {selected ? <Check className="h-4 w-4 shrink-0 text-blue-600" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}