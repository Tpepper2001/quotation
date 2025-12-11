import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Camera, 
  ChevronLeft, 
  Search, 
  Trash2, 
  FileText, 
  Send, 
  MoreVertical,
  Calculator,
  Save
} from 'lucide-react';

// --- 1. MOCK "SMART" DATABASE ---
// In a real app, this fetches from an API or local SQLite db
const MATERIAL_DB = [
  { id: 'm1', name: '2x4 Stud (8ft)', cost: 4.50, category: 'Framing', unit: 'ea' },
  { id: 'm2', name: 'Drywall Sheet (4x8)', cost: 12.00, category: 'Drywall', unit: 'sheet' },
  { id: 'm3', name: 'Joint Compound', cost: 18.00, category: 'Drywall', unit: 'bucket' },
  { id: 'm4', name: 'Interior Paint', cost: 45.00, category: 'Finishing', unit: 'gal' },
  { id: 'l1', name: 'General Labor', cost: 65.00, category: 'Labor', unit: 'hr' },
  { id: 'l2', name: 'Electrical Rough-in', cost: 85.00, category: 'Labor', unit: 'hr' },
  { id: 'c1', name: 'Concrete (3000psi)', cost: 140.00, category: 'Foundation', unit: 'yd³' },
];

// --- 2. UTILITY FUNCTIONS ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('dashboard'); // dashboard, builder, preview
  const [activeQuote, setActiveQuote] = useState(null);
  const [history, setHistory] = useState([
    { id: 101, client: 'Smith Residence', total: 4500, status: 'Sent', date: 'Oct 12' },
    { id: 102, client: 'Downtown Reno', total: 12400, status: 'Draft', date: 'Oct 14' },
  ]);

  // --- ACTIONS ---
  const startNewQuote = () => {
    setActiveQuote({
      id: Date.now(),
      clientName: '',
      projectTitle: '',
      items: [], // { id, name, qty, cost, unit, ... }
      taxRate: 0.08,
    });
    setView('builder');
  };

  const saveQuote = () => {
    // In real app: save to local storage/db
    const existingIndex = history.findIndex(q => q.id === activeQuote.id);
    const summary = {
      id: activeQuote.id,
      client: activeQuote.clientName || 'Untitled Project',
      total: calculateTotal(activeQuote.items, activeQuote.taxRate).total,
      status: 'Draft',
      date: new Date().toLocaleDateString()
    };

    if (existingIndex >= 0) {
      const newHistory = [...history];
      newHistory[existingIndex] = summary;
      setHistory(newHistory);
    } else {
      setHistory([summary, ...history]);
    }
    setView('dashboard');
  };

  // --- CALCULATIONS ---
  const calculateTotal = (items, taxRate) => {
    const subtotal = items.reduce((acc, item) => acc + (item.cost * item.qty), 0);
    const tax = subtotal * taxRate;
    return { subtotal, tax, total: subtotal + tax };
  };

  // --- RENDER ROUTER ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-safe">
      {view === 'dashboard' && (
        <DashboardView 
          history={history} 
          onNewQuote={startNewQuote} 
        />
      )}
      
      {view === 'builder' && activeQuote && (
        <QuoteBuilder 
          quote={activeQuote} 
          setQuote={setActiveQuote} 
          onBack={() => setView('dashboard')}
          onPreview={() => setView('preview')}
          onSave={saveQuote}
        />
      )}

      {view === 'preview' && activeQuote && (
        <PreviewView 
          quote={activeQuote} 
          onBack={() => setView('builder')}
        />
      )}
    </div>
  );
};

// --- COMPONENT: DASHBOARD ---
const DashboardView = ({ history, onNewQuote }) => {
  return (
    <div className="p-4 max-w-md mx-auto relative h-screen">
      <header className="mb-8 pt-4">
        <h1 className="text-2xl font-bold text-gray-800">Good Morning, Mike</h1>
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
          <div className="bg-blue-600 text-white p-4 rounded-xl min-w-[140px] shadow-lg">
            <p className="text-xs opacity-80">Won this Month</p>
            <p className="text-2xl font-bold">$24,500</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 min-w-[140px] shadow-sm">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-800">3 Quotes</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Quotes</h2>
        <div className="space-y-3 pb-20">
          {history.map((q) => (
            <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-95 transition-transform">
              <div>
                <h3 className="font-bold text-gray-800">{q.client}</h3>
                <p className="text-xs text-gray-500">{q.date} • {q.status}</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-blue-600">{formatCurrency(q.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAB */}
      <button 
        onClick={onNewQuote}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// --- COMPONENT: QUOTE BUILDER ---
const QuoteBuilder = ({ quote, setQuote, onBack, onPreview, onSave }) => {
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  
  const { subtotal, tax, total } = useMemo(() => 
    quote.items.reduce((acc, item) => {
      const sum = acc.subtotal + (item.cost * item.qty);
      return { subtotal: sum, tax: sum * quote.taxRate, total: sum * (1 + quote.taxRate) };
    }, { subtotal: 0, tax: 0, total: 0 }), 
  [quote.items, quote.taxRate]);

  const updateField = (field, value) => setQuote({ ...quote, [field]: value });
  
  const updateItem = (id, field, value) => {
    const newItems = quote.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setQuote({ ...quote, items: newItems });
  };

  const deleteItem = (id) => {
    setQuote({ ...quote, items: quote.items.filter(i => i.id !== id) });
  };

  const addItem = (item) => {
    // Check if item already exists to group (optional logic)
    const newItem = {
      ...item,
      // Create unique instance ID
      id: Math.random().toString(36).substr(2, 9), 
      qty: 1
    };
    setQuote({ ...quote, items: [...quote.items, newItem] });
    setIsItemPickerOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 p-4 pt-12 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-500"><ChevronLeft /></button>
        <div className="flex-1 text-center">
          <input 
            type="text" 
            placeholder="Client Name"
            className="text-center font-bold text-gray-800 placeholder-gray-300 outline-none w-full bg-transparent"
            value={quote.clientName}
            onChange={(e) => updateField('clientName', e.target.value)}
          />
        </div>
        <button onClick={onSave} className="p-2 -mr-2 text-blue-600"><Save size={20} /></button>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Project Details</label>
          <input 
            type="text" 
            placeholder="Project Title (e.g. Kitchen Reno)"
            className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            value={quote.projectTitle}
            onChange={(e) => updateField('projectTitle', e.target.value)}
          />
        </div>

        {quote.items.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Calculator size={48} className="mx-auto mb-2" />
            <p>No items yet. Tap + to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Line Items</label>
            {quote.items.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{item.category}</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-400">QTY</label>
                        <input 
                          type="number" 
                          className="w-16 p-1 bg-gray-50 rounded text-center font-bold border border-gray-200"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <span className="text-gray-400 text-sm">x</span>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-400">UNIT ($)</label>
                        <input 
                          type="number" 
                          className="w-20 p-1 bg-gray-50 rounded text-center font-bold border border-gray-200"
                          value={item.cost}
                          onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(item.qty * item.cost)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => setIsItemPickerOpen(true)}
          className="mt-6 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all"
        >
          <Plus size={20} /> Add Material or Labor
        </button>
      </div>

      {/* Sticky Footer */}
      <div className="bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button 
          onClick={onPreview}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <FileText size={20} /> Review & Send
        </button>
      </div>

      {/* Item Picker Bottom Sheet (Simulated) */}
      {isItemPickerOpen && (
        <ItemPicker 
          onClose={() => setIsItemPickerOpen(false)} 
          onSelect={addItem} 
        />
      )}
    </div>
  );
};

// --- COMPONENT: SMART ITEM PICKER ---
const ItemPicker = ({ onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  
  const filteredItems = MATERIAL_DB.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Search className="text-gray-400" size={20} />
          <input 
            autoFocus
            type="text" 
            placeholder="Type 'Drywall', 'Paint', 'Labor'..." 
            className="flex-1 text-lg outline-none font-medium placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-500 font-medium">Cancel</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {search === '' && (
                <div className="p-2 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Suggested</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {MATERIAL_DB.slice(0,3).map(i => (
                            <button key={i.id} onClick={() => onSelect(i)} className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                                + {i.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

          {filteredItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center group"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-gray-600">{formatCurrency(item.cost)} <span className="text-xs text-gray-400">/ {item.unit}</span></span>
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} />
                 </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: PDF PREVIEW ---
const PreviewView = ({ quote, onBack }) => {
    const { subtotal, tax, total } = quote.items.reduce((acc, item) => {
        const sum = acc.subtotal + (item.cost * item.qty);
        return { subtotal: sum, tax: sum * quote.taxRate, total: sum * (1 + quote.taxRate) };
    }, { subtotal: 0, tax: 0, total: 0 });

  return (
    <div className="flex flex-col h-screen bg-gray-800">
        <header className="p-4 pt-12 text-white flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-300 hover:text-white">
                <ChevronLeft size={20} /> Edit
            </button>
            <h2 className="font-semibold">Preview</h2>
            <div className="w-8"></div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
            {/* Paper Visualization */}
            <div className="bg-white rounded-sm shadow-2xl min-h-[500px] p-8 max-w-2xl mx-auto text-sm">
                <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">Quote</h1>
                        <p className="text-gray-500 mt-1">#{quote.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-lg">My Construction Co.</div>
                        <div className="text-gray-500">123 Builder Lane</div>
                        <div className="text-gray-500">555-0123</div>
                    </div>
                </div>

                <div className="mb-8 bg-gray-50 p-4 rounded">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Prepared For</p>
                    <p className="font-bold text-lg">{quote.clientName || 'Client Name'}</p>
                    <p>{quote.projectTitle}</p>
                </div>

                <table className="w-full mb-8">
                    <thead className="border-b border-gray-300">
                        <tr className="text-left text-gray-500">
                            <th className="pb-2 font-medium">Description</th>
                            <th className="pb-2 font-medium text-center">Qty</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-3">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.category}</p>
                                </td>
                                <td className="py-3 text-center text-gray-600">{item.qty}</td>
                                <td className="py-3 text-right font-medium">{formatCurrency(item.cost * item.qty)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-1/2">
                        <div className="flex justify-between mb-2 text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-gray-500">
                            <span>Tax ({(quote.taxRate * 100).toFixed(0)}%)</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-xl text-gray-900">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Photo Attachments Placeholder */}
                <div className="mt-8 border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Camera size={16} />
                        <span className="text-xs font-bold uppercase">Site Photos attached separately</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 pb-8 bg-gray-800">
             <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                <Send size={20} /> Send Quote to Client
            </button>
        </div>
    </div>
  );
};

export default App;
