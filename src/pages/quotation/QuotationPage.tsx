import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Bác có thể import cái QuotationBuilder tui code ở mấy tin nhắn trước vào đây
// import { QuotationBuilder } from '@/components/quotation/QuotationBuilder';

export default function QuotationPage() {
  const { id } = useParams<{ id: string }>(); // Lấy ID của request từ URL
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col p-6 max-w-6xl mx-auto w-full space-y-6">
      
      {/* HEADER CỦA TRANG */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)} // Nút quay lại trang trước
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-emerald-600" />
              Production Quotation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Building quotation for Request ID: <span className="font-semibold text-blue-600">{id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KHU VỰC CHỨA BẢNG BÁO GIÁ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-500 mb-4">
          Giao diện bảng Builder (chọn Milestone, nhập tiền, chọn ngày) sẽ nằm ở đây...
        </p>
        
        {/* Sau này bác nhúng cái Component QuotationBuilder vào đây */}
        {/* <QuotationBuilder requestId={id} /> */}
        
        <div className="h-64 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50">
          <span className="text-slate-400">Quotation Builder Area</span>
        </div>
      </div>

    </div>
  );
}