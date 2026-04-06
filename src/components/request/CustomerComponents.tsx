import { Loader2 } from 'lucide-react';
import { useGetUserById } from '@/hooks/useUserQueries';

export const CustomerCell = ({ customerId }: { customerId: string }) => {
  const { data: user, isLoading } = useGetUserById(customerId);
  if (isLoading) return <div className="flex items-center text-slate-400 text-sm"><Loader2 className="w-3 h-3 animate-spin mr-2" /> Đang tải...</div>;
  if (!user) return <span className="text-slate-500 text-sm">{customerId.substring(0, 8)}...</span>;
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-slate-800 text-sm">{user.firstName} {user.lastName}</span>
      <span className="text-xs text-slate-500">{user.email}</span>
    </div>
  );
};

export const CustomerDetailInline = ({ customerId }: { customerId: string }) => {
  const { data: user, isLoading } = useGetUserById(customerId);
  if (isLoading) return <span className="flex items-center text-slate-400 text-sm"><Loader2 className="w-3 h-3 animate-spin mr-2" /> Đang tải...</span>;
  if (!user) return <span className="truncate max-w-[180px]">{customerId}</span>;
  return (
    <div className="flex flex-col">
      <span className="truncate max-w-[180px]" title={`${user.firstName} ${user.lastName}`}>{user.firstName} {user.lastName}</span>
      {user.phoneNumber && <span className="text-xs text-slate-500 font-normal">{user.phoneNumber}</span>}
    </div>
  );
};