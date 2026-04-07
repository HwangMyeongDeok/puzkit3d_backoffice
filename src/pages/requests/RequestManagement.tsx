import { useState, useMemo } from 'react';
import { Search, Filter, Archive, Loader2 } from 'lucide-react';
import { useGetRequests, useUpdateCustomRequest } from '@/hooks/useCustomDesignRequestQueries';
import type { CustomDesignRequest } from '@/types/types';

// Import thư viện shadcn
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import từ các file đã tách
import { formatDate, formatCurrency, getStatusBadge, getTypeBadge } from '@/lib/requestHelpers';
import { CustomerCell } from '@/components/request/CustomerComponents';
import { RequestDetailDialog } from '@/components/request/RequestDetailDialog';

export default function RequestManagementPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRequest, setSelectedRequest] = useState<CustomDesignRequest | null>(null);
  
  const { data: responseData, isLoading } = useGetRequests({
    pageNumber: 1,
    pageSize: 100,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  });

  const { mutate: updateRequest, isPending: isUpdating } = useUpdateCustomRequest(selectedRequest?.id || '');

  const openRequest = (req: CustomDesignRequest) => {
    setSelectedRequest(req);
  };  

  const handleTabSwitch = (tab: 'active' | 'history') => {
    setActiveTab(tab);
    setStatusFilter('All');
    setSelectedRequest(null);
  };

  const filteredData = useMemo(() => {
    if (!responseData?.items) return [];
    
    return responseData.items.filter(req => {
      // Đã tháo rào chặn status theo tab ở đây để bảng hiển thị FULL status (kể cả reject, approve)
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCode = req.code?.toLowerCase().includes(query);
        const matchCustomer = req.customerId?.toLowerCase().includes(query);
        if (!matchCode && !matchCustomer) return false;
      }
      return true;
    });
  }, [responseData, searchQuery]); // Xóa activeTab khỏi dependency vì không dùng để filter bảng nữa

  const handleUpdateStatus = (newStatus: string, customNote?: string) => {
    if (!selectedRequest) return;
    updateRequest(
      {
        ...selectedRequest,
        status: newStatus, 
        note: customNote || '',
        sketches: [] 
      },
      {
        onSuccess: () => setSelectedRequest(null)
      }
    );
  };

  return (
    <div className="h-full flex flex-col relative w-full">
      {/* Page Header & Tabs */}
      <div className="flex flex-col mb-6 space-y-4">
        <div>
          <h1 className="text-slate-800 font-bold text-2xl tracking-tight">Request Center</h1>
          <p className="text-slate-500 text-sm mt-1">Manage incoming design requests from customers.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg w-fit border border-slate-200">
          <button
            onClick={() => handleTabSwitch('active')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'active' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Active Requests
          </button>
          <button
            onClick={() => handleTabSwitch('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center ${
              activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Archive className="w-4 h-4 mr-1.5" /> History Log
          </button>
        </div>
      </div>
        
      {/* Tool Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-sm"
            placeholder="Search Code or Customer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Shadcn Select Filter (Đã trả lại logic 4 options theo tab) */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm flex-1 sm:flex-none">
          <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-0 shadow-none focus:ring-0 focus:ring-offset-0 h-8 text-sm font-medium text-slate-700 bg-transparent outline-none">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {activeTab === 'active' ? (
                <>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="MissingInformation">Missing Information</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? filteredData.map((req) => (
                <tr 
                  key={req.id} 
                  onClick={() => openRequest(req)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-950 group-hover:text-blue-600 transition-colors">{req.code || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">{getTypeBadge(req.type)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(req.createdAt)}</td>
                  <td className="px-6 py-4"><CustomerCell customerId={req.customerId} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{req.desiredQuantity} units</td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(req.targetBudget)}</td>
                  <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {!isLoading && (
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900">No requests found</p>
                        <p className="text-sm">Adjust your filters or try a different tab.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal / Dialog */}
      <RequestDetailDialog 
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        isUpdating={isUpdating}
        activeTab={activeTab}
        handleUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}