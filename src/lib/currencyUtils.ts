 // Currency exchange rates (approximate - could be fetched from an API in production)
 // Using ILS as base currency
 const EXCHANGE_RATES: Record<string, number> = {
   ILS: 1,
   USD: 3.65, // 1 USD = ~3.65 ILS
   EUR: 4.0,  // 1 EUR = ~4.0 ILS
   GBP: 4.65, // 1 GBP = ~4.65 ILS
 };
 
 export const convertToILS = (amount: number, fromCurrency: string): number => {
   const rate = EXCHANGE_RATES[fromCurrency] || 1;
   return amount * rate;
 };
 
 export const convertFromILS = (amount: number, toCurrency: string): number => {
   const rate = EXCHANGE_RATES[toCurrency] || 1;
   return amount / rate;
 };
 
 export const getExchangeRate = (currency: string): number => {
   return EXCHANGE_RATES[currency] || 1;
 };
 
 export const SUPPORTED_CURRENCIES = [
   { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
   { code: 'USD', symbol: '$', name: 'US Dollar' },
   { code: 'EUR', symbol: '€', name: 'Euro' },
   { code: 'GBP', symbol: '£', name: 'British Pound' },
 ];