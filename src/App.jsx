import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Briefcase,
  Layers,
  Save
} from 'lucide-react';

// --- 1. INITIAL DATA STRUCTURE (CSI MasterFormat Style) ---
const INITIAL_PROJECT = {
  id: 1,
  title: "Proposed Residential Block - Block A",
  client: "Dangote Refinery Housing",
  currency: "₦", // Change to $ or £ as needed
  divisions: [
    {
      id: 'd1',
      code: '03',
      name: 'Concrete Works',
      isOpen: true,
      items: [
        { id: 'i1', code: '3.1.1', desc: 'Grade 25 Concrete in Foundations', unit: 'm³', qty: 150, matRate: 45000, labRate: 5000, plantRate: 2000 },
        { id: 'i2', code: '3.1.2', desc: 'Y12 High Yield Reinforcement', unit: 'kg', qty: 2500, matRate: 850, labRate: 150, plantRate: 0 },
      ]
    },
    {
      id: 'd2',
      code: '04',
      name: 'Masonry',
      isOpen: false,
      items: [
        { id: 'i3', code: '4.1.1', desc: '225mm Sandcrete Hollow Blocks', unit: 'm²', qty: 400, matRate: 6000, labRate: 1200, plantRate: 0 },
      ]
    }
  ]
};

// --- 2. UTILITY: CURRENCY FORMATTER ---
const formatMoney = (amount, currency = '₦') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN', // Using Naira as example based on your location, easy to change
    currencyDisplay: 'narrowSymbol'
  }).format(amount).replace('NGN', currency);
};

const App = () => {
  const [project, setProject] = useState(INITIAL_PROJECT);
  const [activeDivision, setActiveDivision] = useState(null); // For adding items

  // --- CALCULATIONS ---
  const projectTotal = useMemo(() => {
    return project.divisions.reduce((divAcc, div) => {
      const divTotal = div.items.reduce((itemAcc, item) => {
        const rate = item.matRate + item.labRate + item.plantRate;
        return itemAcc + (rate * item.qty);
      }, 0);
      return divAcc + divTotal;
    }, 0);
  }, [project]);

  // --- ACTIONS ---
  const toggleDivision = (divId) => {
    setProject(prev => ({
      ...prev,
      divisions: prev.divisions.map(d => 
        d.id === divId ? { ...d, isOpen: !d.isOpen } : d
      )
    }));
  };

  const updateItem = (divId, itemId, field, value) => {
    setProject(prev => ({
      ...prev,
      divisions: prev.divisions.map(d => {
        if (d.id !== divId) return d;
        return {
          ...d,
          items: d.items.map(item => 
            item.id === itemId ? { ...item, [field]: parseFloat(value) || 0 } : item
          )
        };
      })
    }));
  };

  const deleteItem = (divId, itemId) => {
    setProject(prev => ({
      ...prev,
      divisions: prev.divisions.map(d => {
        if (d.id !== divId) return d;
        return { ...d, items: d.items.filter(i => i.id !== itemId) };
      })
    }));
  };

  const addDivision = () => {
    const name = prompt("Enter Division Name (e.g., '05 Metals'):");
    if (!name) return;
    setProject(prev => ({
      ...prev,
      divisions: [...prev.divisions, {
        id: Date.now().toString(),
        code: '0X',
        name: name,
        isOpen: true,
        items: []
      }]
    }));
  };

  const addItemToDivision = (divId) => {
    const desc = prompt("Enter Item Description:");
    if (!desc) return;
    
    setProject(prev => ({
      ...prev,
      divisions: prev.divisions.map(d => {
        if (d.id !== divId) return d;
        return {
          ...d,
          items: [...d.items, {
            id: Date.now().toString(),
            code: `${d.code}.${d.items.length + 1}`,
            desc: desc,
            unit: 'ea',
            qty: 1,
            matRate: 0,
            labRate: 0,
            plantRate: 0
          }]
        };
      })
    }));
  };

  // --- EXPORT TO CSV (SPREADSHEET) ---
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header Row
    csvContent += "Division,Item Code,Description,Unit,Quantity,Material Rate,Labor Rate,Plant Rate,Total Rate,Total Amount\n";

    project.divisions.forEach(div => {
      div.items.forEach(item => {
        const totalRate = item.matRate + item.labRate + item.plantRate;
        const totalAmount = totalRate * item.qty;
        // Escape commas in description
        const cleanDesc = `"${item.desc.replace(/"/g, '""')}"`;
        
        const row = [
          div.name,
          item.code,
          cleanDesc,
          item.unit,
          item.qty,
          item.matRate,
          item.labRate,
          item.plantRate,
          totalRate,
          totalAmount
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_BOQ.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* --- HEADER --- */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest font-bold">
              <Briefcase size={14} />
              Bill of Quantities
            </div>
            <h1 className="text-xl font-bold mt-1">{project.title}</h1>
            <p className="text-sm text-slate-400">{project.client}</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400 uppercase">Grand Total</p>
                <p className="text-2xl font-bold text-green-400">{formatMoney(projectTotal, project.currency)}</p>
             </div>
             <button 
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg"
             >
               <FileSpreadsheet size={18} />
               <span className="hidden sm:inline">Export to Excel</span>
             </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE TOTAL BAR (Sticky under header) --- */}
      <div className="md:hidden bg-slate-800 text-white p-3 flex justify-between items-center sticky top-[88px] z-10 shadow-sm">
         <span className="text-sm font-medium text-slate-300">Total Est. Cost</span>
         <span className="text-lg font-bold text-green-400">{formatMoney(projectTotal, project.currency)}</span>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-6xl mx-auto p-2 md:p-6 pb-24">
        
        {/* DIVISIONS LIST */}
        <div className="space-y-4">
          {project.divisions.map((div) => (
            <div key={div.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Division Header */}
              <div 
                onClick={() => toggleDivision(div.id)}
                className="bg-slate-100 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {div.isOpen ? <ChevronDown size={20} className="text-slate-500"/> : <ChevronRight size={20} className="text-slate-500"/>}
                  <div>
                    <span className="font-mono text-xs font-bold bg-slate-300 text-slate-700 px-2 py-0.5 rounded mr-2">{div.code}</span>
                    <span className="font-bold text-slate-800">{div.name}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {formatMoney(div.items.reduce((acc, item) => acc + ((item.matRate + item.labRate + item.plantRate) * item.qty), 0), project.currency)}
                </div>
              </div>

              {/* Division Items (The Spreadsheet View) */}
              {div.isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-16">Code</th>
                        <th className="p-3 min-w-[200px]">Description</th>
                        <th className="p-3 w-16 text-center">Unit</th>
                        <th className="p-3 w-20 text-center">Qty</th>
                        <th className="p-3 w-24 text-right bg-blue-50/50">Mat Rate</th>
                        <th className="p-3 w-24 text-right bg-orange-50/50">Lab Rate</th>
                        <th className="p-3 w-24 text-right bg-purple-50/50">Plant</th>
                        <th className="p-3 w-28 text-right">Amount</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {div.items.map((item) => {
                         const totalRate = item.matRate + item.labRate + item.plantRate;
                         return (
                          <tr key={item.id} className="hover:bg-slate-50 group">
                            <td className="p-3 font-mono text-slate-500 text-xs">{item.code}</td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={item.desc}
                                onChange={(e) => updateItem(div.id, item.id, 'desc', e.target.value)}
                                className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                              />
                            </td>
                            <td className="p-3">
                               <input 
                                type="text" 
                                value={item.unit}
                                onChange={(e) => updateItem(div.id, item.id, 'unit', e.target.value)}
                                className="w-full text-center bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.qty}
                                onChange={(e) => updateItem(div.id, item.id, 'qty', e.target.value)}
                                className="w-full text-center font-bold bg-slate-50 p-1 rounded border border-slate-200 focus:border-blue-500 outline-none"
                              />
                            </td>
                            {/* Rates Inputs */}
                            <td className="p-3 text-right bg-blue-50/30">
                              <input 
                                type="number" 
                                value={item.matRate}
                                onChange={(e) => updateItem(div.id, item.id, 'matRate', e.target.value)}
                                className="w-full text-right bg-transparent outline-none text-slate-600 focus:text-blue-600"
                              />
                            </td>
                            <td className="p-3 text-right bg-orange-50/30">
                              <input 
                                type="number" 
                                value={item.labRate}
                                onChange={(e) => updateItem(div.id, item.id, 'labRate', e.target.value)}
                                className="w-full text-right bg-transparent outline-none text-slate-600 focus:text-orange-600"
                              />
                            </td>
                            <td className="p-3 text-right bg-purple-50/30">
                              <input 
                                type="number" 
                                value={item.plantRate}
                                onChange={(e) => updateItem(div.id, item.id, 'plantRate', e.target.value)}
                                className="w-full text-right bg-transparent outline-none text-slate-600 focus:text-purple-600"
                              />
                            </td>
                            
                            <td className="p-3 text-right font-bold text-slate-800">
                              {formatMoney(totalRate * item.qty, '')}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => deleteItem(div.id, item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={() => addItemToDivision(div.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Line Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Division Button */}
        <button 
          onClick={addDivision}
          className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-400 transition-all"
        >
          <Layers size={20} /> Add New Division (e.g., Electrical)
        </button>

      </main>
    </div>
  );
};

export default App;
