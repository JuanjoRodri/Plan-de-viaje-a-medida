import type { JsonPriceEstimate } from "@/types/enhanced-database"
import { Euro, DollarSign, PoundSterling } from "lucide-react" // O iconos genéricos de moneda

interface JsonPriceDisplayProps {
  priceEstimate: JsonPriceEstimate
}

export default function JsonPriceDisplay({ priceEstimate }: JsonPriceDisplayProps) {
  if (!priceEstimate.amount) {
    return null
  }

  const getCurrencyIcon = () => {
    switch (priceEstimate.currency.toUpperCase()) {
      case "EUR":
        return <Euro className="h-4 w-4 mr-1 text-primary" />
      case "USD":
        return <DollarSign className="h-4 w-4 mr-1 text-primary" />
      case "GBP":
        return <PoundSterling className="h-4 w-4 mr-1 text-primary" />
      default:
        return <span className="mr-1 text-primary">{priceEstimate.currency}</span>
    }
  }

  return (
    <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 flex items-center">
      {getCurrencyIcon()}
      <strong>
        {priceEstimate.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </strong>
      {priceEstimate.perPerson && (
        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">(por persona)</span>
      )}
      {priceEstimate.notes && (
        <p className="ml-2 text-xs text-slate-500 dark:text-slate-400 italic">({priceEstimate.notes})</p>
      )}
    </div>
  )
}
