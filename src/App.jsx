import React, { useState, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Settings, 
  Plus, 
  Trash2, 
  Upload,
  LayoutTemplate,
  Briefcase,
  Calculator,
  PenTool
} from 'lucide-react';

// --- 1. CONFIGURATION ---
const INITIAL_PROJECT = {
  title: "BILL OF QUANTITIES",
  subTitle: "Rehabilitating and refurbishment of existing steel tank",
  clientLabel: "Client:",
  clientName: "",
  dateLabel: "Date:",
  dateValue: new Date().toLocaleDateString(),
  currency: "₦", 
  logo: null,
  // NEW FIELDS
  multiplier: 1,
  multiplierLabel: "For two sites",
  showSignatures: true
};

const INITIAL_COLUMNS = {
  unit: { label: "UNIT", visible: true },
  qty: { label: "QTY", visible: true },
  waste: { label: "WST%", visible: false }, 
  mat: { label: "MATERIAL", visible: true }, // Set to false in settings if you just want RATE
  lab: { label: "LABOR", visible: true },    // Set to false in settings if you just want RATE
  plant: { label: "PLANT", visible: false },
  rate: { label: "RATE", visible: true },
  amount: { label: "AMOUNT", visible: true }
};

const App = () => {
  const [items, setItems] = useState([]); 
  const [project, setProject] = useState(INITIAL_PROJECT);
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef(null);

  // --- CALCULATIONS ---
  const { calculatedItems, subTotal, grandTotal } = useMemo(() => {
    const calculated = items.map(item => {
      if (item.type === 'item') {
        const wasteMultiplier = 1 + (item.waste / 100);
        // If columns are hidden, we assume user might type directly into rate, 
        // but for now we keep the formula capability.
        const rate = (item.mat * wasteMultiplier) + item.lab + item.plant;
        const total = rate * item.qty;
        return { ...item, calculatedRate: rate, calculatedTotal: total };
      }
      return item;
    });

    const sub = calculated.reduce((sum, item) => sum + (item.calculatedTotal || 0), 0);
    const total = sub * project.multiplier;

    return { calculatedItems: calculated, subTotal: sub, grandTotal: total };
  }, [items, project.multiplier]);

  // --- ACTIONS ---
  const updateProject = (field, value) => setProject(prev => ({ ...prev, [field]: value }));
  
  const updateColumn = (key, field, value) => {
    setColumns(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addItem = (type) => {
    const newItem = {
      id: Date.now().toString(),
      type, 
      code: items.length + 1 < 10 ? `0${items.length + 1}` : `${items.length + 1}`, // Auto-number logic 01, 02...
      desc: type === 'section' ? 'SECTION TITLE' : '', 
      unit: type === 'item' ? 'Lot' : '', 
      qty: 1, waste: 0, mat: 0, lab: 0, plant: 0 
    };
    setItems([...items, newItem]);
  };

  const deleteItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProject('logo', url);
    }
  };

  // --- EXPORTS ---
  const handlePrint = () => window.print();

  const handleExcelExport = () => {
    let csv = `S/N,Description,${columns.unit.label},${columns.qty.label}`;
    if (columns.waste.visible) csv += `,${columns.waste.label}`;
    if (columns.mat.visible) csv += `,${columns.mat.label}`;
    if (columns.lab.visible) csv += `,${columns.lab.label}`;
    if (columns.plant.visible) csv += `,${columns.plant.label}`;
    csv += `,${columns.rate.label},${columns.amount.label}\n`;

    calculatedItems.forEach(item => {
      let row = `"${item.code}","${item.desc.replace(/"/g, '""')}",${item.unit},${item.qty}`;
      if (columns.waste.visible) row += `,${item.waste}`;
      if (columns.mat.visible) row += `,${item.mat}`;
      if (columns.lab.visible) row += `,${item.lab}`;
      if (columns.plant.visible) row += `,${item.plant}`;
      
      const rate = item.type === 'item' ? item.calculatedRate.toFixed(2) : '';
      const total = item.type === 'item' ? item.calculatedTotal.toFixed(2) : '';
      row += `,${rate},${total}`;
      
      csv += row + "\n";
    });

    // Subtotal Row
    if (project.multiplier !== 1) {
        csv += `,,,Subtotal,,,,,,${subTotal.toFixed(2)}\n`;
        csv += `,,,${project.multiplierLabel} (x${project.multiplier}),,,,,, \n`;
    }
    // Grand Total Row
    csv += `,,,GRAND TOTAL,,,,,,${grandTotal.toFixed(2)}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  // --- RENDER HELPERS ---
  const formatMoney = (val) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-800 pb-20 print:bg-white print:pb-0">
      
      {/* --- TOOLBAR --- */}
      <div className="bg-slate-900 text-white p-3 flex justify-between items-center sticky top-0 z-50 print:hidden shadow-md">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="text-blue-400" size={20}/>
          <span className="font-bold hidden sm:inline">BOQ Builder Pro</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 hover:bg-slate-800 rounded flex items-center gap-2 text-sm">
            <Settings size={16}/> Settings
          </button>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <button onClick={handleExcelExport} className="p-2 bg-green-700 hover:bg-green-600 rounded flex items-center gap-2 text-sm font-medium transition-colors">
            <FileSpreadsheet size={16}/> Excel
          </button>
          <button onClick={handlePrint} className="p-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-2 text-sm font-medium transition-colors">
            <Printer size={16}/> PDF / Print
          </button>
        </div>
      </div>

      {/* --- SETTINGS PANEL --- */}
      {isSettingsOpen && (
        <div className="bg-white border-b border-gray-200 p-6 print:hidden animate-in slide-in-from-top duration-200 shadow-lg relative z-40">
           <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Column Visibility */}
              <div>
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-3">Columns</h3>
                <div className="space-y-2">
                  {Object.keys(columns).map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={columns[key].visible} 
                        onChange={(e) => updateColumn(key, 'visible', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">{columns[key].label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Multiplier Settings (NEW) */}
              <div>
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-3 flex items-center gap-2"><Calculator size={14}/> Site Multiplier</h3>
                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1">Number of Sites (X)</label>
                  <input 
                    type="number"
                    min="1"
                    value={project.multiplier}
                    onChange={(e) => updateProject('multiplier', parseFloat(e.target.value) || 1)}
                    className="border border-gray-300 rounded px-2 py-1 w-full font-bold"
                  />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Label Text</label>
                   <input 
                     value={project.multiplierLabel}
                     onChange={(e) => updateProject('multiplierLabel', e.target.value)}
                     className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                     placeholder="e.g. For two sites"
                   />
                </div>
              </div>

               {/* General Settings & Signatures */}
               <div className="col-span-2">
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-3">Document Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Currency Symbol</label>
                        <input 
                            value={project.currency}
                            onChange={(e) => updateProject('currency', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-center font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Signature Block</label>
                         <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input 
                                type="checkbox" 
                                checked={project.showSignatures} 
                                onChange={(e) => updateProject('showSignatures', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm font-medium text-slate-700">Show Signatures</span>
                        </label>
                    </div>
                </div>
                
                <div className="mt-4">
                   <label className="text-xs text-slate-400 block mb-1">Company Logo</label>
                   <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 border border-dashed border-gray-300 px-4 py-2 rounded text-sm text-slate-600 hover:bg-gray-50 hover:border-blue-400 w-full justify-center">
                     <Upload size={16}/> {project.logo ? 'Change Logo' : 'Upload Logo'}
                   </button>
                   <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*"/>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MAIN DOCUMENT CANVAS --- */}
      <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-2xl my-8 print:shadow-none print:m-0 print:w-full print:max-w-none">
        <div className="p-8 md:p-12">
          
          {/* HEADER SECTION */}
          <header className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
             <div className="flex-1">
               <input 
                 value={project.title} 
                 onChange={(e) => updateProject('title', e.target.value)}
                 className="text-2xl md:text-3xl font-black text-slate-900 w-full uppercase bg-transparent outline-none placeholder-slate-300"
                 placeholder="CLICK TO EDIT TITLE"
               />
               <textarea 
                 value={project.subTitle} 
                 onChange={(e) => updateProject('subTitle', e.target.value)}
                 rows={2}
                 className="text-lg text-slate-500 w-full font-medium bg-transparent outline-none resize-none overflow-hidden"
                 placeholder="Click to add project description..."
               />
               
               <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <input value={project.clientLabel} onChange={(e) => updateProject('clientLabel', e.target.value)} className="text-xs text-slate-400 uppercase font-bold bg-transparent outline-none w-full"/>
                    <input value={project.clientName} onChange={(e) => updateProject('clientName', e.target.value)} placeholder="Enter Client Name" className="font-bold text-slate-800 bg-transparent outline-none w-full placeholder-slate-300"/>
                  </div>
                  <div>
                    <input value={project.dateLabel} onChange={(e) => updateProject('dateLabel', e.target.value)} className="text-xs text-slate-400 uppercase font-bold bg-transparent outline-none w-full"/>
                    <input value={project.dateValue} onChange={(e) => updateProject('dateValue', e.target.value)} className="font-bold text-slate-800 bg-transparent outline-none w-full"/>
                  </div>
               </div>
             </div>
             
             <div className="w-32 h-32 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden ml-4">
               {project.logo ? (
                 <img src={project.logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <span className="text-xs text-gray-300 text-center p-2">Settings > Upload Logo</span>
               )}
             </div>
          </header>

          {/* TABLE */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="p-2 text-left font-bold w-12">S/N</th>
                <th className="p-2 text-left font-bold">DESCRIPTION</th>
                {columns.unit.visible && <th className="p-2 text-center font-bold w-16">{columns.unit.label}</th>}
                {columns.qty.visible && <th className="p-2 text-center font-bold w-16">{columns.qty.label}</th>}
                
                {columns.waste.visible && <th className="p-2 text-center font-bold text-xs text-gray-500 w-16 bg-gray-50 print:bg-transparent">{columns.waste.label}</th>}
                {columns.mat.visible && <th className="p-2 text-right font-bold w-24 bg-blue-50/50 print:bg-transparent text-blue-900 print:text-black">{columns.mat.label}</th>}
                {columns.lab.visible && <th className="p-2 text-right font-bold w-24 bg-orange-50/50 print:bg-transparent text-orange-900 print:text-black">{columns.lab.label}</th>}
                {columns.plant.visible && <th className="p-2 text-right font-bold w-24 bg-purple-50/50 print:bg-transparent text-purple-900 print:text-black">{columns.plant.label}</th>}
                
                {columns.rate.visible && <th className="p-2 text-right font-bold w-28">{columns.rate.label}</th>}
                {columns.amount.visible && <th className="p-2 text-right font-black w-32 bg-gray-50 print:bg-transparent">{columns.amount.label} ({project.currency})</th>}
                <th className="print:hidden w-8"></th>
              </tr>
            </thead>
            <tbody>
              {/* EMPTY STATE */}
              {items.length === 0 && (
                <tr className="print:hidden">
                  <td colSpan="12" className="p-12 text-center border-b border-dashed border-gray-300">
                    <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-medium mb-2">No items added yet</p>
                    <p className="text-sm text-gray-400">Click buttons below to add items.</p>
                  </td>
                </tr>
              )}

              {calculatedItems.map((item) => {
                if (item.type === 'section') {
                  return (
                    <tr key={item.id} className="bg-yellow-50 print:bg-transparent border-b border-black">
                      <td className="p-2 font-bold"><input value={item.code} onChange={(e) => updateItem(item.id, 'code', e.target.value)} className="bg-transparent w-full font-bold outline-none"/></td>
                      <td colSpan={10} className="p-2">
                        <input value={item.desc} onChange={(e) => updateItem(item.id, 'desc', e.target.value)} className="bg-transparent w-full font-bold uppercase text-red-700 print:text-black outline-none placeholder-red-200" placeholder="SECTION TITLE"/>
                      </td>
                      <td className="print:hidden p-2 text-center">
                        <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent group break-inside-avoid">
                    <td className="p-2 align-top"><input value={item.code} onChange={(e) => updateItem(item.id, 'code', e.target.value)} className="bg-transparent w-full text-gray-500 outline-none text-center"/></td>
                    <td className="p-2 align-top"><textarea value={item.desc} onChange={(e) => updateItem(item.id, 'desc', e.target.value)} rows={1} className="bg-transparent w-full outline-none resize-none overflow-hidden h-auto min-h-[1.5em]"/></td>
                    
                    {columns.unit.visible && <td className="p-2 align-top"><input value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="bg-transparent w-full text-center outline-none"/></td>}
                    {columns.qty.visible && <td className="p-2 align-top"><input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value))} className="bg-transparent w-full text-center font-bold outline-none"/></td>}
                    
                    {columns.waste.visible && <td className="p-2 align-top bg-gray-50 print:bg-transparent"><input type="number" value={item.waste} onChange={(e) => updateItem(item.id, 'waste', parseFloat(e.target.value))} className="bg-transparent w-full text-center text-xs text-gray-500 outline-none"/></td>}
                    {columns.mat.visible && <td className="p-2 align-top bg-blue-50/30 print:bg-transparent"><input type="number" value={item.mat} onChange={(e) => updateItem(item.id, 'mat', parseFloat(e.target.value))} className="bg-transparent w-full text-right text-xs text-blue-800 print:text-black outline-none"/></td>}
                    {columns.lab.visible && <td className="p-2 align-top bg-orange-50/30 print:bg-transparent"><input type="number" value={item.lab} onChange={(e) => updateItem(item.id, 'lab', parseFloat(e.target.value))} className="bg-transparent w-full text-right text-xs text-orange-800 print:text-black outline-none"/></td>}
                    {columns.plant.visible && <td className="p-2 align-top bg-purple-50/30 print:bg-transparent"><input type="number" value={item.plant} onChange={(e) => updateItem(item.id, 'plant', parseFloat(e.target.value))} className="bg-transparent w-full text-right text-xs text-purple-800 print:text-black outline-none"/></td>}
                    
                    {columns.rate.visible && <td className="p-2 align-top text-right font-medium text-gray-600">{formatMoney(item.calculatedRate)}</td>}
                    {columns.amount.visible && <td className="p-2 align-top text-right font-bold bg-gray-50 print:bg-transparent">{formatMoney(item.calculatedTotal)}</td>}
                    
                    <td className="print:hidden p-2 text-center align-top">
                      <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              {project.multiplier !== 1 && (
                <>
                  <tr className="border-t-2 border-slate-300">
                    <td colSpan={2} className="p-2 text-right font-bold text-slate-500">Subtotal</td>
                    <td colSpan={10} className="p-2 text-right font-bold text-slate-600">{formatMoney(subTotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-2 text-right font-bold text-slate-500">{project.multiplierLabel} <span className="text-black bg-yellow-200 px-1 rounded ml-1">X{project.multiplier}</span></td>
                    <td colSpan={10} className="p-2 text-right font-bold text-slate-600"></td>
                  </tr>
                </>
              )}
              <tr className="border-t-4 border-double border-black">
                <td colSpan={2} className="p-4 text-right font-black uppercase text-xl">Grand Total</td>
                <td colSpan={10} className="p-4 text-right font-black text-xl">{project.currency} {formatMoney(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>

          {/* --- ADD BUTTONS --- */}
          <div className="mt-8 flex justify-center gap-4 print:hidden">
            <button onClick={() => addItem('section')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 font-medium text-sm">
               <Plus size={16}/> Add Section Header
            </button>
            <button onClick={() => addItem('item')} className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-white hover:border-slate-400 font-medium text-sm">
               <Plus size={16}/> Add Line Item
            </button>
          </div>

          {/* SIGNATURE AREA (OPTIONAL) */}
          {project.showSignatures && (
            <div className="mt-20 grid grid-cols-2 gap-20 print:flex print:justify-between break-inside-avoid">
                <div>
                   <div className="border-b border-black h-8 mb-2"></div>
                   <p className="text-xs font-bold uppercase text-slate-500">Contractor Signature</p>
                </div>
                <div>
                   <div className="border-b border-black h-8 mb-2"></div>
                   <p className="text-xs font-bold uppercase text-slate-500">Client Signature</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
