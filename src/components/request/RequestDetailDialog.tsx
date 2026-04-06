import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Calendar, MapPin, Shield, Image as ImageIcon, ZoomIn, MessageSquare, Ruler, Package, UserCircle, XCircle, Send, FileText } from 'lucide-react';
import { CustomerDetailInline } from './CustomerComponents';
import { RequirementDetailInline } from './RequirementDetailInline';
import { ZoomableImage } from '@/components/request/ZoomableImage';
import { formatDate, formatCurrency, getStatusBadge, getTypeBadge } from '@/lib/requestHelpers';
import type { CustomDesignRequest } from '@/types/types';

interface RequestDetailDialogProps {
  selectedRequest: CustomDesignRequest | null;
  setSelectedRequest: (req: CustomDesignRequest | null) => void;
  isUpdating: boolean;
  activeTab: 'active' | 'history';
  handleUpdateStatus: (status: string, note?: string) => void;
}

export const RequestDetailDialog = ({ selectedRequest, setSelectedRequest, isUpdating, activeTab, handleUpdateStatus }: RequestDetailDialogProps) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [actionRequiringNote, setActionRequiringNote] = useState<'Rejected' | 'MissingInformation' | null>(null);
  const [reasonNote, setReasonNote] = useState('');
  const [prevRequestId, setPrevRequestId] = useState<string | undefined>(undefined);
  
  if (selectedRequest?.id !== prevRequestId) {
    setPrevRequestId(selectedRequest?.id);
    setActionRequiringNote(null);
    setReasonNote('');
    setZoomedImage(null);
  }

  const handleSubmitWithNote = () => {
    if (!actionRequiringNote || !reasonNote.trim()) return;
    handleUpdateStatus(actionRequiringNote, reasonNote);
  };

  return (
    <Dialog 
      open={!!selectedRequest} 
      onOpenChange={(open) => {
        if (!open && !isUpdating) setSelectedRequest(null);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[92vh] p-0 flex flex-col overflow-hidden bg-slate-50 border-slate-200">
        {selectedRequest && (
          <>
            {/* Header */}
            <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center space-x-3 pr-8">
                <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  {selectedRequest.code || selectedRequest.id.substring(0, 8)}
                  {getTypeBadge(selectedRequest.type)}
                </DialogTitle>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <DialogDescription className="sr-only">Detailed view</DialogDescription>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6 relative">
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                )}

                {/* Customer Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-5">
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</p>
                    <div className="text-sm font-medium text-slate-900 flex items-center">
                      <UserCircle className="w-5 h-5 mr-2 text-slate-400 shrink-0" /> 
                      <CustomerDetailInline customerId={selectedRequest.customerId} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted Date</p>
                    <p className="text-slate-800 flex items-center text-sm font-medium"><Calendar className="w-4 h-4 mr-2 text-slate-400" /> {formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  <div className="flex-1 space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Target</p>
                    <p className="text-slate-800 flex items-center text-sm font-medium"><MapPin className="w-4 h-4 mr-2 text-slate-400" /> {formatDate(selectedRequest.desiredDeliveryDate)}</p>
                  </div>
                </div>

                {/* Display Request Note (If exists) */}
                {/* Bạn có thể đổi selectedRequest.note thành trường tương ứng trong DB của bạn (vd: reason, customerNote) */}
                {selectedRequest.note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center text-amber-800 font-bold mb-2 text-sm uppercase tracking-wider">
                      <FileText className="w-4 h-4 mr-2" /> Note / Reason
                    </div>
                    <p className="text-amber-900 text-sm leading-relaxed whitespace-pre-wrap bg-white/60 p-4 border border-amber-100 rounded-lg">
                      {selectedRequest.note}
                    </p>
                  </div>
                )}

                {/* Requirements & Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-600" /> Customer Requirements
                  </h3>
                  
                  {selectedRequest.customDesignRequirementId && <RequirementDetailInline requirementId={selectedRequest.customDesignRequirementId} />}
                  
                  {selectedRequest.sketchesUrls && selectedRequest.sketchesUrls.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center text-slate-700 font-semibold mb-3 text-sm">
                        <ImageIcon className="w-4 h-4 mr-2 text-slate-400" /> Attached Sketches
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRequest.sketchesUrls.map((url, idx) => (
                          <div 
                            key={idx} 
                            className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square flex items-center justify-center cursor-pointer"
                            onClick={() => setZoomedImage(url)}
                          >
                            <img src={url} alt={`Sketch ${idx + 1}`} className="object-contain w-full h-full" loading="lazy" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center">
                              <button className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors">
                                <ZoomIn className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center text-slate-700 font-semibold mb-2 text-sm">
                        <MessageSquare className="w-4 h-4 mr-2 text-slate-400" /> Description / Prompt
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 border border-slate-100 rounded-lg">
                        {selectedRequest.customerPrompt || 'No description provided.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lightbox Zoom */}
                {zoomedImage && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
                    <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <ZoomableImage key={zoomedImage} src={zoomedImage} />
                      <div className="flex items-center justify-between w-full px-1">
                        <p className="text-white/40 text-xs">Scroll to zoom · Double click to reset</p>
                        <button onClick={() => setZoomedImage(null)} className="text-white/70 hover:text-white transition-colors">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specs */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center"><Ruler className="w-4 h-4 mr-2 text-blue-600" /> Specs & Dimensions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-start">
                      <div className="bg-blue-50 p-2 rounded-lg mr-3"><Ruler className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Dimensions (L × W × H)</p>
                        <p className="font-medium text-slate-900 text-sm">{selectedRequest.desiredLengthMm} <span className="text-slate-400 text-xs font-normal">mm</span> × {selectedRequest.desiredWidthMm} <span className="text-slate-400 text-xs font-normal">mm</span> × {selectedRequest.desiredHeightMm} <span className="text-slate-400 text-xs font-normal">mm</span></p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-start">
                      <div className="bg-blue-50 p-2 rounded-lg mr-3"><Package className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-medium">Requested Quantity</p>
                        <p className="font-medium text-slate-900 text-sm">{selectedRequest.desiredQuantity} Unit{selectedRequest.desiredQuantity > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financials */}
                <div className="bg-white border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center">Target Budget</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedRequest.targetBudget)}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Design Revisions</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                      {selectedRequest.usedSupportConceptDesignTime} included
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <DialogFooter className="w-full">
                {activeTab === 'active' ? (
                  actionRequiringNote ? (
                    // FORM NHẬP LÝ DO (Hiển thị khi bấm Reject hoặc Ask for Info)
                    <div className="w-full flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="mb-3 flex justify-between items-center">
                        <p className="text-sm font-semibold text-slate-800">
                          {actionRequiringNote === 'Rejected' 
                            ? 'Lý do từ chối request này:' 
                            : 'Thông tin cần khách hàng bổ sung:'}
                        </p>
                        <span className="text-xs text-slate-400">Bắt buộc</span>
                      </div>
                      
                      <textarea
                        value={reasonNote}
                        onChange={(e) => setReasonNote(e.target.value)}
                        placeholder="Nhập nội dung chi tiết để gửi cho khách hàng..."
                        className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none mb-3 bg-slate-50"
                        disabled={isUpdating}
                        autoFocus
                      />
                      
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setActionRequiringNote(null);
                            setReasonNote('');
                          }}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={handleSubmitWithNote}
                          disabled={isUpdating || !reasonNote.trim()}
                          className={`flex items-center px-6 py-2 font-medium rounded-lg transition-colors text-sm shadow-sm
                            ${actionRequiringNote === 'Rejected' 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 disabled:bg-red-300' 
                              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 disabled:bg-orange-300'
                            }`}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          Gửi & Cập nhật
                        </button>
                      </div>
                    </div>
                  ) : (
                    // CÁC NÚT MẶC ĐỊNH
                    <div className="flex flex-wrap sm:justify-end gap-2 w-full">
                      <button 
                        disabled={isUpdating} 
                        onClick={() => setActionRequiringNote('Rejected')} 
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm text-sm disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        disabled={isUpdating} 
                        onClick={() => setActionRequiringNote('MissingInformation')} 
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-orange-200 text-orange-600 font-medium rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors shadow-sm text-sm disabled:opacity-50"
                      >
                        Ask for Info
                      </button>
                      <button 
                        disabled={isUpdating} 
                        onClick={() => handleUpdateStatus('Processing')} 
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm disabled:opacity-50"
                      >
                        Process Request
                      </button>
                      <button 
                        disabled={isUpdating} 
                        onClick={() => handleUpdateStatus('Approved')} 
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-sm disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex justify-end w-full">
                    <button 
                      onClick={() => setSelectedRequest(null)} 
                      className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                    >
                      Close Record
                    </button>
                  </div>
                )}
              </DialogFooter>
            </div>
            
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};