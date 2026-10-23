const currency = process.env.APP_CURRENCY ?? "PKR";

export function formatConsultationFee(amountMinor: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency }).format(amountMinor / 100);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
