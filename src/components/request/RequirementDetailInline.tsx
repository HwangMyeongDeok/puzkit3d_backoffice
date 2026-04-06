import { Loader2, Puzzle, Layers, Wrench, Gauge, Activity, Package } from 'lucide-react';
import { useRequirements } from '@/hooks/useCustomDesignRequirementQueries';
import { useTopics, useMaterials, useAssemblyMethods, useCapabilities } from '@/hooks/useMasterDataQueries';
import type { AssemblyMethod, Capability, Material, Topic } from '@/types/types';

export const RequirementDetailInline = ({ requirementId }: { requirementId: string }) => {
  const { useGetRequirementById } = useRequirements();
  const { data: reqData, isLoading: reqLoading } = useGetRequirementById(requirementId);
  const req = Array.isArray(reqData) ? reqData[0] : reqData;
  
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const { data: assemblies, isLoading: assembliesLoading } = useAssemblyMethods();
  const { data: capabilities, isLoading: capabilitiesLoading } = useCapabilities(); 

  const isLoading = reqLoading || topicsLoading || materialsLoading || assembliesLoading || capabilitiesLoading;
  
  if (isLoading) return <div className="flex items-center text-slate-500 text-sm p-4 bg-white rounded-xl border border-slate-200"><Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" /> Đang tải cấu hình kỹ thuật...</div>;
  if (!req) return null;

  const topicName = topics?.find((t: Topic) => t.id === req.topicId)?.name || 'N/A';
  const materialName = materials?.find((m: Material) => m.id === req.materialId)?.name || 'N/A';
  const assemblyName = assemblies?.find((a: AssemblyMethod) => a.id === req.assemblyMethodId)?.name || 'N/A';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1"><p className="text-xs text-slate-500 font-medium flex items-center"><Puzzle className="w-3 h-3 mr-1"/> Chủ đề</p><p className="text-sm font-semibold text-slate-800">{topicName}</p></div>
        <div className="space-y-1"><p className="text-xs text-slate-500 font-medium flex items-center"><Layers className="w-3 h-3 mr-1"/> Vật liệu</p><p className="text-sm font-semibold text-slate-800">{materialName}</p></div>
        <div className="space-y-1"><p className="text-xs text-slate-500 font-medium flex items-center"><Wrench className="w-3 h-3 mr-1"/> Lắp ráp</p><p className="text-sm font-semibold text-slate-800">{assemblyName}</p></div>
        <div className="space-y-1"><p className="text-xs text-slate-500 font-medium flex items-center"><Gauge className="w-3 h-3 mr-1"/> Độ khó</p><p className="text-sm font-semibold text-orange-600">{req.difficulty}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center"><Activity className="w-3 h-3 mr-1"/> Capabilities</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {req.capabilityIds && req.capabilityIds.length > 0 ? (
               req.capabilityIds.map((id: string, idx: number) => {
                 const name = capabilities?.find((c: Capability) => c.id === id)?.name || 'Unknown';
                 return (
                   <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                     {name}
                   </span>
                 );
               })
            ) : (
              <span className="text-sm font-medium text-slate-700">N/A</span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center"><Package className="w-3 h-3 mr-1"/> Part Quantity Range</p>
          <p className="text-sm font-medium text-slate-700">
            {req.minPartQuantity} - {req.maxPartQuantity} parts
          </p>
        </div>
      </div>
    </div>
  );
};