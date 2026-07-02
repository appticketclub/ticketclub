"use client"; 
import { createContext, useContext, useState, useEffect, ReactNode } from "react"; 
import { createClient } from "@/lib/supabase/client"; 

type Currency = "EUR" | "CZK"; 

type CurrencyContextType = { 
  currency: Currency; 
  rate: number; // EUR to CZK rate 
  setCurrency: (c: Currency) => void; 
  convert: (amount: number, from: Currency) => number; 
  format: (amount: number, from: Currency) => string; 
}; 

const CurrencyContext = createContext<CurrencyContextType>({ 
  currency: "EUR", 
  rate: 25, 
  setCurrency: () => {}, 
  convert: (a) => a, 
  format: (a) => String(a), 
}); 

export function CurrencyProvider({ children, initialCurrency }: { children: ReactNode; initialCurrency: Currency }) { 
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency); 
  const [rate, setRate] = useState(25); // fallback rate 

  // Fetch live EUR/CZK rate 
  useEffect(() => { 
    fetch("https://api.frankfurter.app/latest?from=EUR&to=CZK") 
      .then(r => r.json()) 
      .then(data => { 
        if (data?.rates?.CZK) setRate(data.rates.CZK); 
      }) 
      .catch(() => setRate(25)); // fallback 
  }, []); 

  async function setCurrency(c: Currency) { 
    setCurrencyState(c); 
    const supabase = createClient(); 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (user) { 
      await supabase.from("profiles").update({ display_currency: c }).eq("id", user.id); 
    } 
  } 

  function convert(amount: number, from: Currency): number { 
    if (from === currency) return amount; 
    if (from === "EUR" && currency === "CZK") return amount * rate; 
    if (from === "CZK" && currency === "EUR") return amount / rate; 
    return amount; 
  } 

  function format(amount: number, from: Currency): string { 
    const converted = convert(amount, from); 
    const symbol = currency === "EUR" ? "€" : "Kč"; 
    const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(converted); 
    return formatted + " " + symbol; 
  } 

  return ( 
    <CurrencyContext.Provider value={{ currency, rate, setCurrency, convert, format }}> 
      {children} 
    </CurrencyContext.Provider> 
  ); 
} 

export function useCurrency() { 
  return useContext(CurrencyContext); 
}
