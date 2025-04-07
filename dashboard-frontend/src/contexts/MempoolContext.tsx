import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface Transaction {
  txid: string;
  fee_rate: number;
  size: number;
  inputs: number;
  outputs: number;
  age: number;
}

interface MempoolContextType {
  transactions: Transaction[];
  selected: string[];
  loading: boolean;
  error: string | null;
  autoSelect: (strategy: 'feeRate' | 'age' | 'size', count?: number) => void;
  setSelected: (txids: string[]) => void;
  refresh: () => Promise<void>;
  submitSelection: () => Promise<void>;
}

const MempoolContext = createContext<MempoolContextType>({} as MempoolContextType);

export const MempoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Transaction[]>('http://localhost:3000/transactions');
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch mempool transactions');
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const autoSelect = (strategy: 'feeRate' | 'age' | 'size', count = 5) => {
    const sorted = [...transactions].sort((a, b) => {
      if (strategy === 'feeRate') return b.fee_rate - a.fee_rate;
      if (strategy === 'age') return a.age - b.age;
      return a.size - b.size;
    });
    setSelected(sorted.slice(0, count).map(tx => tx.txid));
  };

  const submitSelection = async () => {
    try {
      await axios.post('http://localhost:3000/selected', selected);
      toast.success(`Submitted ${selected.length} transactions to miner`);
      setSelected([]);
    } catch (err) {
      toast.error('Failed to submit transactions');
    }
  };

  // Set up WebSocket connection for real-time updates.
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    ws.onmessage = (event) => {
      try {
        const newTransactions = JSON.parse(event.data) as Transaction[];
        setTransactions(newTransactions);
      } catch (e) {
        console.error("Error parsing WebSocket message", e);
      }
    };
    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    return () => {
      ws.close();
    };
  }, []);

  // Optionally, keep polling as a fallback (or remove if not needed)
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MempoolContext.Provider
      value={{
        transactions,
        selected,
        loading,
        error,
        autoSelect,
        setSelected,
        refresh,
        submitSelection,
      }}
    >
      {children}
    </MempoolContext.Provider>
  );
};

export const useMempool = () => useContext(MempoolContext);



