import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Outlet, setOutletId } from '../services/api';

const OUTLET_SELECTED_KEY = '@coffee_app_selected_outlet';

interface OutletContextType {
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  selectOutlet: (outlet: Outlet) => Promise<void>;
  loadingOutlets: boolean;
}

const OutletContext = createContext<OutletContextType>({} as OutletContextType);

export function OutletProvider({ children }: { children: ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [loadingOutlets, setLoadingOutlets] = useState(true);

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    try {
      const [list, storedRaw] = await Promise.all([
        api.getOutlets(),
        AsyncStorage.getItem(OUTLET_SELECTED_KEY),
      ]);

      setOutlets(list);

      if (storedRaw) {
        const stored: Outlet = JSON.parse(storedRaw);
        const match = list.find(o => o.id === stored.id) || (list.length > 0 ? list[0] : null);
        if (match) {
          setSelectedOutlet(match);
          await setOutletId(String(match.id));
        }
      } else if (list.length > 0) {
        setSelectedOutlet(list[0]);
        await setOutletId(String(list[0].id));
        await AsyncStorage.setItem(OUTLET_SELECTED_KEY, JSON.stringify(list[0]));
      }
    } catch (e) {
      console.error('[OutletContext] loadOutlets error', e);
    } finally {
      setLoadingOutlets(false);
    }
  };

  const selectOutlet = async (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    await setOutletId(String(outlet.id));
    await AsyncStorage.setItem(OUTLET_SELECTED_KEY, JSON.stringify(outlet));
  };

  return (
    <OutletContext.Provider value={{ outlets, selectedOutlet, selectOutlet, loadingOutlets }}>
      {children}
    </OutletContext.Provider>
  );
}

export const useOutlet = () => useContext(OutletContext);
