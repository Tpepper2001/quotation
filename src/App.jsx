import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Settings, 
  Calculator, 
  Hammer, 
  ChevronRight, 
  Plus, 
  Save, 
  Download, 
  Trash2, 
  ArrowLeft,
  PieChart,
  HardHat
} from 'lucide-react';

// --- 1. ENGINEERING MASTER DATA (Dropdown Sources) ---
const MASTER_DATA = {
  units: ['m', 'm²', 'm³', 'kg', 'ton', 'nr', 'bag', 'roll', 'hr', 'day', 'ls'],
  divisions: [
    { code: '01', name: 'General Requirements' },
    { code: '02', name: 'Existing Conditions' },
    { code: '03', name: 'Concrete' },
    { code: '04', name: 'Masonry' },
    { code: '05', name: 'Metals' },
    { code: '06', name: 'Wood, Plastics, Composites' },
    { code: '07', name: 'Thermal & Moisture Protection' },
    { code: '08', name: 'Openings (Doors/Windows)' },
    { code: '09', name: 'Finishes' },
    { code: '26', name: 'Electrical' },
  ],
  currencies: ['₦', '$', '£', '€']
};

// --- 2. SAMPLE PROJECTS ---
const INITIAL_PROJECTS = [
  {
    id: 101,
    title: "Lekki Commercial Hub - Phase 1",
    client: "Urban Developers Ltd",
    status: "Tender",
    created: "2023-11-10",
    markup: 15,
    items: [
      { id: 'x1', div: '03', desc: 'C25 Concrete Columns', unit: 'm³', qty: 450, mat: 55000, lab: 8000, plant: 2500, waste: 5 },
      { id: 'x2', div: '04', desc: '9" Sandcrete Blockwall', unit: 'm²', qty: 1200, mat: 6500, lab: 1500, plant: 0, waste: 3 },
    ]
  },
  {
    id: 102,
    title: "Residential Duplex - Yaba",
    client: "Mr. Okonkwo",
    status: "Draft",
    created: "2023-12-05",
    markup: 10,
    items: []
  }
];

// --- 3. HELPER FUNCTIONS ---
const formatMoney = (amount) => new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount);

const App = () => {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'editor'
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [showTools, setShowTools] = useState(false);

  // --- ACTIONS ---
  const createProject = () => {
    const title = prompt("Project Title:");
    if (!title) return;
    const newProject = {
      id: Date.now(),
      title,
      client: "New Client",
      status: "Draft",
      created: new Date().toISOString().split('T')[0],
      markup: 10,
      items: []
    };
    setProjects([newProject, ...projects]);
  };

  const openProject = (id) => {
    setActiveProjectId(id);
    setView('editor');
  };

  const updateProject = (projectId, updatedItems) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, items: updatedItems } : p));
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-16 md:w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 z-20 shadow-xl">
        <div className="text-blue-500 mb-4"><HardHat size={32} /></div>
        
        <NavBtn icon={<LayoutDashboard size={24}/>} label="Projects" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavBtn icon={<Calculator size={24}/>} label="Tools" active={showTools} onClick={() => setShowTools(!showTools)} />
        
        <div className="mt-auto flex flex-col gap-4">
           <NavBtn icon={<Settings size={24}/>} label="Settings" />
        </div>
      </aside>

      {/* TOOL SIDEBAR (SLIDE OVER) */}
      {showTools && (
        <div className="w-80 bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 flex items-center gap-2"><Hammer size={16}/> Engineer Tools</h3>
             <button onClick={() => setShowTools(false)} className="text-slate-400 hover:text-red-500">×</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <ToolCard title="Concrete Volume">
                 <div className="grid grid-cols-3 gap-2 text-xs">
                    <input type="number" placeholder="L (m)" className="border p-1 rounded"/>
                    <input type="number" placeholder="W (m)" className="border p-1 rounded"/>
                    <input type="number" placeholder="D (m)" className="border p-1 rounded"/>
                 </div>
                 <div className="bg-blue-50 p-2 mt-2 rounded text-center font-bold text-blue-700">= 0.00 m³</div>
              </ToolCard>

              <ToolCard title="Rebar Weight Converter">
                 <select className="w-full border p-1 rounded mb-2 text-sm">
                    <option>Y10 (0.617 kg/m)</option>
                    <option>Y12 (0.888 kg/m)</option>
                    <option>Y16 (1.580 kg/m)</option>
                 </select>
                 <input type="number" placeholder="Total Length (m)" className="w-full border p-1 rounded text-sm"/>
                 <div className="bg-orange-50 p-2 mt-2 rounded text-center font-bold text-orange-700">= 0.00 kg</div>
              </ToolCard>

              <ToolCard title="Unit Converter">
                 <div className="flex gap-2 mb-2">
                    <input type="number" className="w-1/2 border p-1 rounded"/>
                    <select className="w-1/2 border p-1 rounded text-xs"><option>Meters</option><option>Feet</option></select>
                 </div>
                 <div className="text-center text-slate-400">↓</div>
                 <div className="bg-slate-100 p-2 mt-2 rounded text-center font-mono">= 0.00</div>
              </ToolCard>
           </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {view === 'dashboard' ? (
          <Dashboard 
            projects={projects} 
            onCreate={createProject} 
            onOpen={openProject} 
            onDelete={(id) => setProjects(projects.filter(p => p.id !== id))}
          />
        ) : (
          <BOQEditor 
            project={projects.find(p => p.id === activeProjectId)} 
            masterData={MASTER_DATA}
            onUpdate={updateProject}
            onBack={() => setView('dashboard')}
          />
        )}

      </main>
    </div>
  );
};

// --- SUB-COMPONENT: DASHBOARD ---
const Dashboard = ({ projects, onCreate, onOpen, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Project Dashboard</h1>
          <p className="text-slate-500">Manage your Bills of Quantities and Estimates</p>
        </div>
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          <Plus size={20} /> New Project BOQ
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
          <div key={p.id} onClick={() => onOpen(p.id)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer group transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`text-xs font-bold px-2 py-1 rounded ${p.status === 'Tender' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                {p.status}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="text-slate-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-blue-600">{p.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{p.client}</p>
            <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-100">
              <span>{p.items.length} Line Items</span>
              <span className="flex items-center">Open <ChevronRight size={14}/></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: THE ENGINEER EDITOR ---
const BOQEditor = ({ project, masterData, onUpdate, onBack }) => {
  // Stats Calculation
  const stats = useMemo(() => {
    let materialCost = 0;
    let laborCost = 0;
    let totalBase = 0;
    
    project.items.forEach(item => {
      // Calculate Waste: (Mat Cost * Qty) * Waste%
      const matTotal = (item.mat * item.qty) * (1 + (item.waste/100));
      const labTotal = item.lab * item.qty;
      const plantTotal = item.plant * item.qty;
      
      materialCost += matTotal;
      laborCost += labTotal;
      totalBase += (matTotal + labTotal + plantTotal);
    });

    const profit = totalBase * (project.markup / 100);
    return { materialCost, laborCost, totalBase, profit, grandTotal: totalBase + profit };
  }, [project]);

  const updateItem = (itemId, field, value) => {
    const updated = project.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
    onUpdate(project.id, updated);
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      div: '01',
      desc: '',
      unit: 'm',
      qty: 1,
      mat: 0, lab: 0, plant: 0, waste: 0
    };
    onUpdate(project.id, [...project.items, newItem]);
  };

  // Export CSV Logic
  const handleExport = () => {
    let csv = "Division,Description,Unit,Qty,Waste %,Material Rate,Labor Rate,Plant Rate,Total Rate,Total Cost\n";
    project.items.forEach(i => {
       const matWasted = i.mat * (1 + i.waste/100);
       const rate = matWasted + i.lab + i.plant;
       const cost = rate * i.qty;
       csv += `${i.div},"${i.desc}",${i.unit},${i.qty},${i.waste},${i.mat},${i.lab},${i.plant},${rate.toFixed(2)},${cost.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}_BOQ.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">{project.title} <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">REV-02</span></h2>
            <p className="text-xs text-slate-500">{project.client} • {project.items.length} Items</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden md:block">
              <p className="text-xs text-slate-400 font-bold uppercase">Estimated Total</p>
              <p className="font-mono text-xl font-bold text-slate-800">₦ {formatMoney(stats.grandTotal)}</p>
           </div>
           <button onClick={handleExport} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded font-medium flex items-center gap-2">
             <Download size={16}/> Export CSV
           </button>
           <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 shadow">
             <Save size={16}/> Save
           </button>
        </div>
      </header>

      {/* MAIN SPREADSHEET AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <table className="w-full text-sm border-collapse min-w-[1000px]">
          <thead className="bg-slate-100 text-slate-500 font-bold sticky top-0 shadow-sm z-0">
            <tr>
              <th className="p-3 w-12 text-center border-r border-slate-200">#</th>
              <th className="p-3 w-48 text-left border-r border-slate-200">Division (CSI)</th>
              <th className="p-3 text-left border-r border-slate-200">Description</th>
              <th className="p-3 w-24 border-r border-slate-200">Unit</th>
              <th className="p-3 w-24 border-r border-slate-200">Qty</th>
              <th className="p-3 w-20 border-r border-slate-200" title="Waste %">Wst %</th>
              <th className="p-3 w-32 text-right border-r border-slate-200 bg-blue-50/50 text-blue-800">Mat Rate</th>
              <th className="p-3 w-32 text-right border-r border-slate-200 bg-orange-50/50 text-orange-800">Lab Rate</th>
              <th className="p-3 w-32 text-right border-r border-slate-200 bg-purple-50/50 text-purple-800">Plant</th>
              <th className="p-3 w-36 text-right font-black">Total</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {project.items.map((item, idx) => {
              const rowTotal = ((item.mat * (1 + item.waste/100)) + item.lab + item.plant) * item.qty;
              return (
                <tr key={item.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                  
                  {/* DROPDOWN: DIVISION */}
                  <td className="p-2 border-r border-slate-100">
                    <select 
                      value={item.div} 
                      onChange={(e) => updateItem(item.id, 'div', e.target.value)}
                      className="w-full bg-transparent p-1 outline-none text-xs font-medium text-slate-600"
                    >
                      {masterData.divisions.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
                    </select>
                  </td>

                  {/* INPUT: DESCRIPTION */}
                  <td className="p-2 border-r border-slate-100">
                    <input 
                      type="text" 
                      value={item.desc} 
                      onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                      placeholder="Enter item description..."
                      className="w-full bg-transparent outline-none p-1 placeholder-slate-300"
                    />
                  </td>

                  {/* DROPDOWN: UNIT */}
                  <td className="p-2 border-r border-slate-100">
                    <select 
                       value={item.unit}
                       onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                       className="w-full bg-slate-50 p-1 rounded border border-transparent hover:border-slate-300 outline-none"
                    >
                      {masterData.units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>

                  {/* INPUT: QTY */}
                  <td className="p-2 border-r border-slate-100">
                    <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value))} className="w-full text-center font-bold bg-slate-50 p-1 rounded border border-slate-200" />
                  </td>

                  {/* INPUT: WASTE % */}
                  <td className="p-2 border-r border-slate-100">
                    <input type="number" value={item.waste} onChange={(e) => updateItem(item.id, 'waste', parseFloat(e.target.value))} className="w-full text-center text-xs text-red-500 bg-transparent outline-none" />
                  </td>

                  {/* INPUTS: RATES */}
                  <td className="p-2 bg-blue-50/20 border-r border-slate-100"><input type="number" value={item.mat} onChange={(e) => updateItem(item.id, 'mat', parseFloat(e.target.value))} className="w-full text-right bg-transparent outline-none"/></td>
                  <td className="p-2 bg-orange-50/20 border-r border-slate-100"><input type="number" value={item.lab} onChange={(e) => updateItem(item.id, 'lab', parseFloat(e.target.value))} className="w-full text-right bg-transparent outline-none"/></td>
                  <td className="p-2 bg-purple-50/20 border-r border-slate-100"><input type="number" value={item.plant} onChange={(e) => updateItem(item.id, 'plant', parseFloat(e.target.value))} className="w-full text-right bg-transparent outline-none"/></td>

                  <td className="p-2 text-right font-bold font-mono text-slate-800">{formatMoney(rowTotal)}</td>
                  
                  <td className="p-2 text-center">
                    <button onClick={() => {
                        const newItems = project.items.filter(i => i.id !== item.id);
                        onUpdate(project.id, newItems);
                    }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="p-4">
           <button onClick={addItem} className="text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded transition-colors"><Plus size={18}/> Add Line Item</button>
        </div>

        {/* SUMMARY FOOTER */}
        <div className="bg-white border-t border-slate-300 p-8 mt-8 pb-20">
            <div className="max-w-md ml-auto">
                <h3 className="font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2"><PieChart size={18}/> Cost Analysis</h3>
                <div className="flex justify-between text-sm mb-2"><span>Material Cost (Inc. Waste)</span> <span>{formatMoney(stats.materialCost)}</span></div>
                <div className="flex justify-between text-sm mb-2"><span>Labor Cost</span> <span>{formatMoney(stats.laborCost)}</span></div>
                <div className="flex justify-between font-bold text-slate-700 border-t pt-2 mb-4"><span>Subtotal (Direct Cost)</span> <span>{formatMoney(stats.totalBase)}</span></div>
                
                <div className="flex justify-between items-center mb-4 bg-yellow-50 p-2 rounded">
                    <span className="text-sm font-bold text-yellow-800">Profit / Markup (%)</span>
                    <input type="number" value={project.markup} onChange={(e) => onUpdate(project.id, project.items)} className="w-16 p-1 border rounded text-right font-bold"/>
                </div>
                
                <div className="flex justify-between text-2xl font-black text-slate-900 border-t-2 border-slate-900 pt-4">
                    <span>Grand Total</span>
                    <span>₦ {formatMoney(stats.grandTotal)}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

// --- SMALL UI COMPONENTS ---
const NavBtn = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl flex flex-col items-center gap-1 w-full transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const ToolCard = ({ title, children }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{title}</h4>
    {children}
  </div>
);

export default App;
