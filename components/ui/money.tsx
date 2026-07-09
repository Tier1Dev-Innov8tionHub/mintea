import { formatCurrency } from "@/lib/format";

interface MoneyProps {
  value: number;
  currency?: string;
  prefix?: string;
  className?: string;
}

/**
 * Renders a currency amount marked as sensitive so it can be blurred
 * globally when privacy mode is on (see `html.privacy-hidden` in globals.css).
 */
export function Money({ value, currency, prefix, className }: MoneyProps) {
  return (
    <span data-sensitive className={className}>
      {prefix}
      {formatCurrency(value, currency)}
    </span>
  );
}
