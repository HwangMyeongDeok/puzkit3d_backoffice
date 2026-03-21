'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// ─── Types ───────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
  fromHour: number;
  fromMinute: number;
  toHour: number;
  toMinute: number;
}

interface DateRangePickerProps {
  value?: DateRange | null;
  onChange: (range: DateRange | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Block dates strictly before this (default: today) */
  minDate?: Date;
}

// ─── Constants ───────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const pad     = (n: number) => String(n).padStart(2, '0');

function fmtDisplay(d: Date, h: number, m: number) {
  return `${format(d, 'dd MMM yyyy')} ${pad(h)}:${pad(m)}`;
}
function fmtShort(d: Date, h: number, m: number) {
  return `${format(d, 'dd MMM')} ${pad(h)}:${pad(m)}`;
}

// ─── Component ───────────────────────────────────────────────────

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  minDate,
}: DateRangePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveMin = minDate ?? today;

  // Internal draft state (uncommitted until Apply)
  const [open,       setOpen]       = useState(false);
  const [fromDate,   setFromDate]   = useState<Date | null>(value?.from ?? null);
  const [toDate,     setToDate]     = useState<Date | null>(value?.to   ?? null);
  const [fromH,      setFromH]      = useState(value?.fromHour   ?? 9);
  const [fromM,      setFromM]      = useState(value?.fromMinute ?? 0);
  const [toH,        setToH]        = useState(value?.toHour     ?? 23);
  const [toM,        setToM]        = useState(value?.toMinute   ?? 45);
  const [picking,    setPicking]    = useState<'from' | 'to'>('from');

  // Sync draft with incoming value when popover opens
  const handleOpen = (o: boolean) => {
    if (o) {
      setFromDate(value?.from ?? null);
      setToDate(value?.to ?? null);
      setFromH(value?.fromHour   ?? 9);
      setFromM(value?.fromMinute ?? 0);
      setToH(value?.toHour     ?? 23);
      setToM(value?.toMinute   ?? 45);
      setPicking(value?.from ? 'to' : 'from');
    }
    setOpen(o);
  };

  const handleDayClick = (day: Date) => {
    if (picking === 'from') {
      setFromDate(day);
      setToDate(null);
      setPicking('to');
    } else {
      if (day <= (fromDate!)) {
        // If clicked before/same as from, restart
        setFromDate(day);
        setToDate(null);
        setPicking('to');
      } else {
        setToDate(day);
        setPicking('from'); // both selected
      }
    }
  };

  const handleApply = () => {
    if (!fromDate || !toDate) return;
    onChange({ from: fromDate, to: toDate, fromHour: fromH, fromMinute: fromM, toHour: toH, toMinute: toM });
    setOpen(false);
  };

  const handleClear = () => {
    setFromDate(null); setToDate(null);
    setFromH(9); setFromM(0); setToH(23); setToM(45);
    setPicking('from');
    onChange(null);
  };

  const canApply = !!fromDate && !!toDate;

  // Build range object for DayPicker highlighting
  const selected = fromDate && toDate
    ? { from: fromDate, to: toDate }
    : fromDate
    ? { from: fromDate, to: fromDate }
    : undefined;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-9 text-sm px-3 gap-2',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {value?.from && value?.to ? (
            <span className="flex items-center gap-1.5 overflow-hidden">
              <span className="truncate">{fmtDisplay(value.from, value.fromHour, value.fromMinute)}</span>
              <span className="text-muted-foreground shrink-0">→</span>
              <span className="truncate">{fmtDisplay(value.to, value.toHour, value.toMinute)}</span>
            </span>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 overflow-hidden" align="start" sideOffset={4}>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-0 px-4 pt-3 pb-2.5 border-b">
          {/* From */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className={cn(
              'h-2 w-2 rounded-full border-[1.5px] transition-colors',
              fromDate
                ? 'border-emerald-500 bg-emerald-500'
                : picking === 'from'
                ? 'border-primary bg-primary'
                : 'border-border bg-background',
            )} />
            <span className="text-[10px] text-muted-foreground">Start</span>
            <span className={cn(
              'text-[10px] font-mono font-medium',
              fromDate ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {fromDate ? fmtShort(fromDate, fromH, fromM) : '—'}
            </span>
          </div>

          {/* Connector */}
          <div className={cn(
            'h-px w-10 mb-5 transition-colors',
            fromDate && toDate ? 'bg-emerald-400' : 'bg-border',
          )} />

          {/* To */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className={cn(
              'h-2 w-2 rounded-full border-[1.5px] transition-colors',
              toDate
                ? 'border-emerald-500 bg-emerald-500'
                : picking === 'to'
                ? 'border-primary bg-primary'
                : 'border-border bg-background',
            )} />
            <span className="text-[10px] text-muted-foreground">End</span>
            <span className={cn(
              'text-[10px] font-mono font-medium',
              toDate ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {toDate ? fmtShort(toDate, toH, toM) : '—'}
            </span>
          </div>
        </div>

        {/* ── Calendar ── */}
        <DayPicker
          mode="range"
          selected={selected}
          onDayClick={handleDayClick}
          disabled={{ before: effectiveMin }}
          showOutsideDays
          classNames={{
            months:           'flex',
            month:            'space-y-1',
            caption:          'flex justify-center items-center pt-3 pb-1 relative px-8',
            caption_label:    'text-sm font-medium',
            nav:              'flex items-center',
            nav_button:       cn(
              'h-7 w-7 rounded-md border border-border/50 bg-transparent',
              'flex items-center justify-center text-muted-foreground',
              'hover:bg-muted hover:text-foreground transition-colors',
            ),
            nav_button_previous: 'absolute left-2',
            nav_button_next:     'absolute right-2',
            table:            'w-full border-collapse px-3 pb-3',
            head_row:         'flex',
            head_cell:        'text-muted-foreground rounded-md w-8 font-medium text-[11px] text-center',
            row:              'flex w-full mt-0.5',
            cell:             'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
            day:              cn(
              'h-8 w-8 p-0 font-normal text-[12px] rounded-md',
              'hover:bg-muted hover:text-foreground transition-colors',
              'aria-selected:opacity-100',
            ),
            day_selected:     'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md',
            day_range_start:  'bg-primary text-primary-foreground rounded-r-none',
            day_range_end:    'bg-primary text-primary-foreground rounded-l-none',
            day_range_middle: 'bg-primary/10 text-foreground rounded-none',
            day_today:        'font-semibold',
            day_outside:      'text-muted-foreground opacity-50',
            day_disabled:     'text-muted-foreground opacity-30 cursor-not-allowed',
          }}
        />

        {/* ── Time selectors ── */}
        <div className="border-t grid grid-cols-2 gap-0 bg-muted/30">
          {/* Start time */}
          <div className="px-4 py-3 border-r">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Start time</p>
            <div className="flex items-center gap-1.5">
              <Select
                value={String(fromH)}
                onValueChange={(v) => setFromH(parseInt(v))}
                disabled={!fromDate}
              >
                <SelectTrigger className="h-7 w-[52px] text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-40">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-xs">{pad(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">:</span>
              <Select
                value={String(fromM)}
                onValueChange={(v) => setFromM(parseInt(v))}
                disabled={!fromDate}
              >
                <SelectTrigger className="h-7 w-[52px] text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-xs">{pad(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End time */}
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">End time</p>
            <div className="flex items-center gap-1.5">
              <Select
                value={String(toH)}
                onValueChange={(v) => setToH(parseInt(v))}
                disabled={!toDate}
              >
                <SelectTrigger className="h-7 w-[52px] text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-40">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-xs">{pad(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">:</span>
              <Select
                value={String(toM)}
                onValueChange={(v) => setToM(parseInt(v))}
                disabled={!toDate}
              >
                <SelectTrigger className="h-7 w-[52px] text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-xs">{pad(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-4 py-2.5 flex justify-end gap-2 bg-muted/30">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleApply} disabled={!canApply}>
            Apply
          </Button>
        </div>

      </PopoverContent>
    </Popover>
  );
}