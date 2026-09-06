export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseNumberString(val: string): number {
  const clean = val.replace(/[^0-9.]/g, "");
  return parseFloat(clean) || 0;
}
