import { CheckCircle, XCircle, Clock, Ban, Inbox, Activity, AlertCircle, Lightbulb, Image as ImageIcon } from 'lucide-react';

export const formatDate = (dateString: string) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s === 'submitted') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Inbox className="w-3.5 h-3.5 mr-1" /> Submitted</div>;
  if (s === 'processing') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Activity className="w-3.5 h-3.5 mr-1" /> Processing</div>;
  if (s === 'missinginformation') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Missing Info</div>;
  if (s === 'approved' || s === 'completed') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 mr-1" /> {status}</div>;
  if (s === 'rejected') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5 mr-1" /> Rejected</div>;
  if (s === 'cancelled' || s === 'expired') return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300"><Ban className="w-3.5 h-3.5 mr-1" /> {status}</div>;
  return <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300"><Clock className="w-3.5 h-3.5 mr-1" /> {status}</div>;
};

export const getTypeBadge = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t === 'sketch') 
    return <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider"><ImageIcon className="w-3 h-3 mr-1" /> Sketch</div>;
  if (t === 'idea') 
    return <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider"><Lightbulb className="w-3 h-3 mr-1" /> Idea</div>;
  
  return <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wider">{type || 'N/A'}</div>;
};