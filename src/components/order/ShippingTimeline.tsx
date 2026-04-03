import { formatDateTime } from './utils';
import { GHN_STATUS_MAP } from './constants';

export interface TrackingLog {
  status: string;
  updatedDate?: string | null;
  description?: string | null;
}

export function ShippingTimeline({ logs, currentGhnStatus }: { logs?: TrackingLog[]; currentGhnStatus?: string }) {
  const hasLogs = logs && logs.length > 0;
  if (!currentGhnStatus && !hasLogs) {
    return <p className="text-sm text-muted-foreground">No tracking information available yet.</p>;
  }
  const displayLogs: TrackingLog[] = hasLogs ? logs! : currentGhnStatus ? [{ status: currentGhnStatus }] : [];
  
  return (
    <ol className="relative border-l border-muted ml-2 space-y-0">
      {displayLogs.map((log, index) => {
        const meta = GHN_STATUS_MAP[log.status] ?? { label: log.status, color: 'text-gray-500' };
        const isFirst = index === 0;
        return (
          <li key={index} className="mb-0 ml-4">
            <span className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${isFirst ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
            <div className="pb-5">
              <p className={`text-sm font-semibold ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                <span className={meta.color}>{meta.label}</span>
              </p>
              {log.updatedDate && <time className="text-xs text-muted-foreground">{formatDateTime(log.updatedDate)}</time>}
              {log.description && <p className="mt-0.5 text-xs text-muted-foreground">{log.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}