import React from 'react';
import { Search, Filter, Download, CreditCard, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { transactionService } from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await transactionService.listTransactions();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-outfit">Transaction Ledger</h1>
          <p className="text-gray-400 font-medium mt-1">Detailed history of all financial activities and fuel disbursements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:flex-none">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search TxID, Truck..." 
                 className="pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-100 transition-all outline-none w-full md:w-64 font-bold"
               />
             </div>
             <button className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all">
               <Filter className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Transaction / Date</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle / Driver</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Type</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan="5" className="px-8 py-20 text-center font-bold text-gray-400 uppercase tracking-widest">Accessing central ledger...</td></tr>
              ) : transactions.length === 0 ? (
                 <tr><td colSpan="5" className="px-8 py-20 text-center font-bold text-gray-400 uppercase tracking-widest">No transactions found.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id || tx.transaction_id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{tx.id || tx.transaction_id}</span>
                        <span className="text-xs font-bold text-gray-400 mt-0.5">{tx.timestamp || tx.date || 'Today, 10:45 AM'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{tx.vehicle || tx.truck_id || 'TRUCK-??'}</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-1">{tx.driver || 'Unknown Driver'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-xs font-black uppercase tracking-widest text-gray-400">
                      {tx.type || 'Fuel Disbursement'}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-base font-black text-gray-900">₹{(tx.amount || tx.total_amount || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                        {tx.status || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
