import { createContext, useContext } from 'react';

const CurrencyContext = createContext(null);
export const CurrencyProvider = ({ children }) => {
  const formatPrice = (amount) => amount == null ? '-' : new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(Number(amount));
  return <CurrencyContext.Provider value={{ currency: 'IDR', currencyInfo: { code: 'IDR', symbol: 'Rp' }, currencies: { IDR: { code: 'IDR' } }, toggleCurrency: () => {}, formatPrice, exchangeRate: 1 }}>{children}</CurrencyContext.Provider>;
};
export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
