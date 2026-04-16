'use client';

import React, { useState } from 'react';
import { Calculator, Pencil, Trash2, Plus, FunctionSquare, Delete, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

// Ensure this path points to your actual types file
import type { Formula, FormulaValueValidation } from '@/services/formulaApi';

import {
  useGetFormulas,
  useGetFormulaDetail,
  useUpdateFormula,
  useCreateFormulaValidation,
  useDeleteFormulaValidation
} from '@/hooks/useFormulaQueries';

// ==========================================
// SYSTEM KEYWORDS
// ==========================================
const PLURAL_VARS = ['CapabilityFactors', 'MaterialFactors', 'TopicFactors', 'AssemblyMethodFactors'];
const SINGULAR_VARS = ['CapabilityFactor', 'MaterialFactor', 'TopicFactor', 'AssemblyMethodFactor', 'PieceCount'];
const FUNCTIONS = ['SUM', 'AVG', 'PRODUCT'];
const OPERATORS = ['+', '-', '*', '/', '(', ')'];
const NUMBERS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];

// ==========================================
// BLOCK TOKEN INTERFACE
// ==========================================
interface Token {
  id: string;
  type: 'function' | 'variable' | 'operator' | 'number';
  value: string;
  innerValue?: string | null;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// ==========================================
// 1. CHILD COMPONENT: FORM EDITOR (VISUAL BLOCK BUILDER)
// ==========================================
  // Thêm hàm này ra bên ngoài component
const parseFormulaExpression = (expression?: string): Token[] => {
  if (!expression) return [];
  const initialTokens: Token[] = [];
  
  // Dùng chuỗi RegExp: Không cần escape dấu / nữa, và đưa dấu - lên đầu mảng để không cần escape
  const regexString = "(SUM|AVG|PRODUCT)\\s*\\(\\s*([A-Za-z]+)?\\s*\\)|([A-Za-z]+)|([-+/*()])|(\\d+(?:\\.\\d+)?)";
  const regex = new RegExp(regexString, "g");
  
  let match;
  while ((match = regex.exec(expression)) !== null) {
    if (match[1]) initialTokens.push({ id: generateId(), type: 'function', value: match[1], innerValue: match[2] || null });
    else if (match[3]) initialTokens.push({ id: generateId(), type: 'variable', value: match[3] });
    else if (match[4]) initialTokens.push({ id: generateId(), type: 'operator', value: match[4] });
    else if (match[5]) initialTokens.push({ id: generateId(), type: 'number', value: match[5] });
  }
  return initialTokens;
};

function FormulaEditorForm({ formula, formulaId, onClose }: { formula: Formula, formulaId: string, onClose: () => void }) {
  const updateFormula = useUpdateFormula(formulaId);
  const createValidation = useCreateFormulaValidation(formulaId);
  const deleteValidation = useDeleteFormulaValidation(formulaId);

  // 1. KHỞI TẠO STATE TRỰC TIẾP TỪ HÀM PARSE (Không dùng useEffect)
  const [tokens, setTokens] = useState<Token[]>(() => parseFormulaExpression(formula.expression));
  const [description, setDescription] = useState<string>(formula.description || '');
  
  // Lấy phần tử cuối cùng làm selectedId mặc định
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initTokens = parseFormulaExpression(formula.expression);
    return initTokens.length > 0 ? initTokens[initTokens.length - 1].id : null;
  });

  // Validation Form States
  const [newValMin, setNewValMin] = useState<string>('');
  const [newValMax, setNewValMax] = useState<string>('');
  const [newValOutput, setNewValOutput] = useState<string>('');

  // ---------------------------------------------------------
  // PARSER: Convert DB expression string into Visual Blocks
  // ---------------------------------------------------------


  const getExpressionString = (tokenList: Token[]) => {
    return tokenList.map(t => {
      if (t.type === 'function') return `${t.value}(${t.innerValue || ''})`;
      if (t.type === 'operator') return ` ${t.value} `;
      return t.value;
    }).join('').replace(/\s+/g, ' ').trim();
  };

  // Helper tìm vị trí chèn (ngay sau block đang chọn, hoặc ở cuối)
  const getInsertIndex = () => {
    if (!selectedId) return tokens.length;
    const idx = tokens.findIndex(t => t.id === selectedId);
    return idx >= 0 ? idx + 1 : tokens.length;
  };

  // ---------------------------------------------------------
  // CLICK HANDLERS (SMART CURSOR INSERTION)
  // ---------------------------------------------------------
  const handleFunctionClick = (fnName: string) => {
    const newToken: Token = { id: generateId(), type: 'function', value: fnName, innerValue: null };
    const newTokens = [...tokens];
    newTokens.splice(getInsertIndex(), 0, newToken);
    
    setTokens(newTokens);
    setSelectedId(newToken.id); // Dịch con trỏ tới hàm mới tạo
  };

  const handlePluralVariableClick = (varName: string) => {
    if (selectedId) {
      const idx = tokens.findIndex(t => t.id === selectedId);
      if (idx >= 0 && tokens[idx].type === 'function' && !tokens[idx].innerValue) {
        const newTokens = [...tokens];
        newTokens[idx] = { ...tokens[idx], innerValue: varName };
        setTokens(newTokens);
        return;
      }
    }
    toast.warning('List variables (ending in "s") must be wrapped in an empty function block. Please click an empty function to select it first!');
  };

  const handleSingularVariableClick = (varName: string) => {
    if (selectedId) {
      const idx = tokens.findIndex(t => t.id === selectedId);
      if (idx >= 0 && tokens[idx].type === 'function' && !tokens[idx].innerValue) {
        toast.warning(`Singular variables cannot be used inside array functions.`);
        return;
      }
    }
    const newToken: Token = { id: generateId(), type: 'variable', value: varName };
    const newTokens = [...tokens];
    newTokens.splice(getInsertIndex(), 0, newToken);
    
    setTokens(newTokens);
    setSelectedId(newToken.id);
  };

  const handleOperatorClick = (op: string) => {
    const newToken: Token = { id: generateId(), type: 'operator', value: op };
    const newTokens = [...tokens];
    newTokens.splice(getInsertIndex(), 0, newToken);
    
    setTokens(newTokens);
    setSelectedId(newToken.id);
  };

  const handleNumberClick = (num: string) => {
    // Nếu đang chọn 1 block số => Nối số vào
    if (selectedId) {
      const idx = tokens.findIndex(t => t.id === selectedId);
      if (idx >= 0 && tokens[idx].type === 'number') {
        const target = tokens[idx];
        if (num === '.' && target.value.includes('.')) return; // Chống bấm 2 dấu thập phân
        
        const newTokens = [...tokens];
        newTokens[idx] = { ...target, value: target.value + num };
        setTokens(newTokens);
        return;
      }
    }

    // Nếu không, tạo block số mới
    const newToken: Token = { id: generateId(), type: 'number', value: num };
    const newTokens = [...tokens];
    newTokens.splice(getInsertIndex(), 0, newToken);
    
    setTokens(newTokens);
    setSelectedId(newToken.id);
  };

  // ---------------------------------------------------------
  // DELETE LOGIC
  // ---------------------------------------------------------
  const handleBackspace = () => {
    if (tokens.length === 0) return;

    // Nếu không chọn gì, mặc định xóa ở cuối cùng
    const idx = selectedId ? tokens.findIndex(t => t.id === selectedId) : tokens.length - 1;
    if (idx === -1) return;

    const target = tokens[idx];
    const newTokens = [...tokens];

    // 1. Tháo biến khỏi function
    if (target.type === 'function' && target.innerValue) {
      newTokens[idx] = { ...target, innerValue: null };
      setTokens(newTokens);
      return;
    }

    // 2. Xóa từng số của một block số dài
    if (target.type === 'number' && target.value.length > 1) {
      newTokens[idx] = { ...target, value: target.value.slice(0, -1) };
      setTokens(newTokens);
      return;
    }

    // 3. Xóa nguyên block
    newTokens.splice(idx, 1);
    setTokens(newTokens);

    // Di chuyển con trỏ tự động lùi về 1 block
    if (idx > 0) {
      setSelectedId(newTokens[idx - 1].id);
    } else if (newTokens.length > 0) {
      setSelectedId(newTokens[0].id);
    } else {
      setSelectedId(null);
    }
  };

  const handleRemoveTokenById = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Không cho trigger hàm select ở dưới
    const idx = tokens.findIndex(t => t.id === id);
    const newTokens = tokens.filter(t => t.id !== id);
    setTokens(newTokens);

    // Nếu xóa trúng block đang được chọn thì dời con trỏ
    if (selectedId === id) {
      if (idx > 0) setSelectedId(newTokens[idx - 1].id);
      else if (newTokens.length > 0) setSelectedId(newTokens[0].id);
      else setSelectedId(null);
    }
  };

  // ---------------------------------------------------------
  // SAVE FORMULA & VALIDATIONS
  // ---------------------------------------------------------
  const handleSaveFormula = async () => {
    if (tokens.length === 0) return toast.error("Formula cannot be empty!");

    const emptyFunction = tokens.find(t => t.type === 'function' && !t.innerValue);
    if (emptyFunction) {
      return toast.error(`The function ${emptyFunction.value}() is empty. Please insert a variable or remove the function!`);
    }

    const cleanExpression = getExpressionString(tokens);
    await updateFormula.mutateAsync({ expression: cleanExpression, description });
    onClose();
  };

  const handleAddValidation = async () => {
    if (!newValMin || !newValMax || !newValOutput) return toast.error('Please enter Min, Max, and Output values.');
    await createValidation.mutateAsync({
      formulaId: formulaId,
      minValue: Number(newValMin),
      maxValue: Number(newValMax),
      output: newValOutput
    });
    setNewValMin(''); setNewValMax(''); setNewValOutput('');
  };

  return (
    <>
      <div className="bg-white p-5 rounded-xl border shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-500 uppercase">1. Formula Builder (Visual Editor)</h3>
          <span className="text-xs text-slate-400 italic">Click a block to edit or insert after it.</span>
        </div>

        {/* ======================================= */}
        {/* CANVAS: FORMULA DISPLAY AREA            */}
        {/* ======================================= */}
        <div 
          className="relative p-5 min-h-[120px] bg-slate-50 border-2 border-slate-300 rounded-xl flex flex-wrap content-start gap-2 items-center cursor-text"
          onClick={() => setSelectedId(null)} // Click vào nền trống thì dời con trỏ về cuối cùng
        >
          {tokens.length === 0 && (
            <span className="text-slate-400 absolute top-5 left-5 select-none pointer-events-none">
              Click the buttons below to build the formula...
            </span>
          )}

          {tokens.map(token => {
            const isSelected = selectedId === token.id;
            
            return (
              <div 
                key={token.id} 
                onClick={(e) => {
                  e.stopPropagation(); // Click vào block thì chặn sự kiện click nền
                  setSelectedId(token.id);
                }}
                className={`group relative flex items-center transition-all cursor-pointer p-0.5 rounded-lg ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50/50' : 'hover:bg-slate-200/50'
                }`}
              >
                <button
                  onClick={(e) => handleRemoveTokenById(token.id, e)}
                  className="hidden group-hover:flex absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center z-10 shadow hover:bg-red-600 transition-transform hover:scale-110"
                >
                  <X size={12} strokeWidth={3} />
                </button>

                {token.type === 'function' && (
                  <div className="bg-green-50 px-2 py-1.5 rounded-lg font-mono text-sm shadow-sm border border-green-300 flex items-center">
                    <span className="text-green-700 font-bold">{token.value}</span>
                    <span className="mx-1 text-green-600 font-bold">(</span>
                    {token.innerValue ? (
                      <span className="text-purple-700 bg-white border border-purple-200 font-semibold px-2 py-0.5 rounded shadow-sm">
                        {token.innerValue}
                      </span>
                    ) : (
                      <span className="text-green-600/70 bg-white/60 px-3 py-0.5 rounded border border-green-300 border-dashed animate-pulse text-xs italic">
                        Awaiting variable...
                      </span>
                    )}
                    <span className="mx-1 text-green-600 font-bold">)</span>
                  </div>
                )}

                {token.type === 'variable' && (
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm border border-blue-200">
                    {token.value}
                  </div>
                )}

                {token.type === 'operator' && (
                  <div className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm font-black shadow-sm border border-slate-300">
                    {token.value}
                  </div>
                )}

                {token.type === 'number' && (
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-mono text-sm font-bold shadow-sm border border-emerald-200">
                    {token.value}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Con trỏ ở cuối cùng (khi ko có block nào đc focus) */}
          {!selectedId && tokens.length > 0 && (
            <div className="w-[3px] h-6 bg-blue-500 animate-pulse ml-1 rounded-full" />
          )}
        </div>

        {/* ======================================= */}
        {/* CONTROL PANEL (BUTTONS)                 */}
        {/* ======================================= */}
        <div className="grid grid-cols-12 gap-5">

          {/* Left Column: Variables & Functions */}
          <div className="col-span-7 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">1. Select Function (For List Variables only)</span>
                <div className="flex flex-wrap gap-2">
                  {FUNCTIONS.map(fn => (
                    <Button
                      key={fn}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 font-medium"
                      onClick={() => handleFunctionClick(fn)}
                    >
                      {fn}()
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">2. List Variables <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px] px-1.5 py-0 h-4">Use inside function</Badge></span>
                <div className="flex flex-wrap gap-2">
                  {PLURAL_VARS.map(v => (
                    <Button key={v} type="button" variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-medium" onClick={() => handlePluralVariableClick(v)}>{v}</Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">3. Singular Variables <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1.5 py-0 h-4">Calculate directly</Badge></span>
                <div className="flex flex-wrap gap-2">
                  {SINGULAR_VARS.map(v => (
                    <Button key={v} type="button" variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium" onClick={() => handleSingularVariableClick(v)}>{v}</Button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Numbers, Operators & Controls */}
          <div className="col-span-5 flex flex-col gap-4">
            <Button type="button" variant="destructive" className="h-10 font-bold shadow-sm" onClick={handleBackspace}>
              <Delete className="w-5 h-5 mr-2" /> Backspace
            </Button>

            <div className="grid grid-cols-2 gap-3 h-full">
              {/* Operators Panel */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase mb-2">Operators</span>
                <div className="grid grid-cols-2 gap-2">
                  {OPERATORS.map(op => (
                    <Button key={op} type="button" variant="outline" className="h-10 font-bold text-lg bg-white shadow-sm border-slate-300 hover:bg-slate-100" onClick={() => handleOperatorClick(op)}>
                      {op}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Number Pad Panel */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase mb-2">Numbers</span>
                <div className="grid grid-cols-3 gap-2">
                  {NUMBERS.map(num => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      className={`h-10 font-bold bg-white shadow-sm border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 ${num === '0' ? 'col-span-2' : ''}`}
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4 pt-4 border-t">
          <Label className="text-slate-600 font-bold">Formula Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter formula description..." className="bg-slate-50" />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveFormula} disabled={updateFormula.isPending} className="bg-blue-600 hover:bg-blue-700 text-white w-32 shadow-sm">
            {updateFormula.isPending ? 'Saving...' : 'Save Formula'}
          </Button>
        </div>
      </div>

      {/* PART 2: VALIDATION TABLE (ALWAYS VISIBLE) */}
      <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-500 uppercase">2. Result Validation (Outputs)</h3>
          {!formula.isNeedValidation && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">Currently defaulting to raw number output</Badge>
          )}
        </div>

        <Table className="border rounded-lg overflow-hidden">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Min Value</TableHead>
              <TableHead>Max Value</TableHead>
              <TableHead>Output Label</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formula.formulaValueValidations?.map((val: FormulaValueValidation) => (
              <TableRow key={val.id}>
                <TableCell className="font-medium text-slate-700">{val.minValue}</TableCell>
                <TableCell className="font-medium text-slate-700">{val.maxValue}</TableCell>
                <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold px-3">{val.output}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteValidation.mutate(val.id)} disabled={deleteValidation.isPending}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-50/50">
              <TableCell><Input type="number" placeholder="From..." value={newValMin} onChange={e => setNewValMin(e.target.value)} className="h-9 bg-white" /></TableCell>
              <TableCell><Input type="number" placeholder="To..." value={newValMax} onChange={e => setNewValMax(e.target.value)} className="h-9 bg-white" /></TableCell>
              <TableCell><Input placeholder="e.g., Hard" value={newValOutput} onChange={e => setNewValOutput(e.target.value)} className="h-9 bg-white" /></TableCell>
              <TableCell>
                <Button size="sm" onClick={handleAddValidation} disabled={createValidation.isPending} className="w-full h-9 bg-slate-800 hover:bg-slate-700 text-white shadow-sm"><Plus className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// ==========================================
// 2. PARENT COMPONENT: DIALOG SHELL (FETCH API)
// ==========================================
function FormulaEditDialog({ formulaId, isOpen, onClose }: { formulaId: string | null, isOpen: boolean, onClose: () => void }) {
  const { data: formula, isLoading } = useGetFormulaDetail(formulaId || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1100px] h-[95vh] flex flex-col p-0 overflow-hidden bg-slate-100">
        <div className="bg-white px-6 py-4 border-b flex justify-between items-center shadow-sm z-10">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FunctionSquare className="w-6 h-6 text-blue-600" />
              Configure Formula: <span className="text-slate-800">{formula?.code || <Skeleton className="w-40 h-6 inline-block ml-2" />}</span>
            </DialogTitle>
            <DialogDescription className="mt-1">Use the Visual Block Builder to construct mathematical expressions accurately.</DialogDescription>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6"><Skeleton className="h-[400px] w-full rounded-xl" /><Skeleton className="h-[200px] w-full rounded-xl" /></div>
          ) : (
            formula && <FormulaEditorForm key={formula.id} formula={formula} formulaId={formulaId!} onClose={onClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 3. MAIN COMPONENT: FORMULA MANAGEMENT PAGE
// ==========================================
export default function FormulaManagement() {
  const { data: formulas, isLoading } = useGetFormulas();
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6 max-w-[1300px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calculator className="w-8 h-8 text-blue-600" /> Formula Management
        </h1>
        <p className="text-muted-foreground mt-2">Configure mathematical expressions and output validations to automatically calculate Price, Difficulty, and Time.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[25%] font-bold">Formula Code</TableHead>
              <TableHead className="w-[45%] font-bold">Current Expression</TableHead>
              <TableHead className="font-bold">Validation Output</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-8"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : formulas?.map((formula: Formula) => (
              <TableRow key={formula.id} className="hover:bg-slate-50 transition-colors">
                <TableCell>
                  <div className="font-bold text-slate-800">{formula.code}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">{formula.description || 'No description'}</div>
                </TableCell>
                <TableCell>
                  {formula.expression ? (
                    <code
                      className="bg-slate-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border border-slate-200 shadow-sm block truncate max-w-[250px] md:max-w-[350px] lg:max-w-[500px]"
                      title={formula.expression}
                    >
                      {formula.expression}
                    </code>
                  ) : (
                    <span className="text-slate-400 italic text-sm">Not configured</span>
                  )}
                </TableCell>
                <TableCell>
                  {formula.isNeedValidation ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2">Text Output</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 px-2">Raw Number</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedFormulaId(formula.id)} className="shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                    <Pencil className="w-4 h-4 mr-2" /> Configure
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedFormulaId && (
        <FormulaEditDialog formulaId={selectedFormulaId} isOpen={!!selectedFormulaId} onClose={() => setSelectedFormulaId(null)} />
      )}
    </div>
  );
}