export const DEMO_SPECIALTIES = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Primary Care", slug: "primary-care", description: "Sample specialty for local preview." },
  { id: "10000000-0000-4000-8000-000000000002", name: "Cardiology", slug: "cardiology", description: "Sample specialty for local preview." },
  { id: "10000000-0000-4000-8000-000000000003", name: "Dermatology", slug: "dermatology", description: "Sample specialty for local preview." },
  { id: "10000000-0000-4000-8000-000000000004", name: "Pediatrics", slug: "pediatrics", description: "Sample specialty for local preview." },
];

export const DEMO_DOCTORS = [
  { id: "20000000-0000-4000-8000-000000000001", displayName: "Dr. Amina Example", biography: "Fictional sample profile to preview the directory and provider page.", qualifications: null, websiteUrl: null, consultationFee: 350000, appointmentDurationMinutes: 30, bufferMinutes: 10, timezone: "Asia/Karachi", imageUrl: null, specialtyName: "Primary Care", specialtySlug: "primary-care", isDemo: true },
  { id: "20000000-0000-4000-8000-000000000002", displayName: "Dr. Omar Sample", biography: "Fictional sample profile to preview the directory and provider page.", qualifications: null, websiteUrl: null, consultationFee: 500000, appointmentDurationMinutes: 30, bufferMinutes: 10, timezone: "Asia/Karachi", imageUrl: null, specialtyName: "Cardiology", specialtySlug: "cardiology", isDemo: true },
  { id: "20000000-0000-4000-8000-000000000003", displayName: "Dr. Leena Demo", biography: "Fictional sample profile to preview the directory and provider page.", qualifications: null, websiteUrl: null, consultationFee: 300000, appointmentDurationMinutes: 30, bufferMinutes: 5, timezone: "Asia/Karachi", imageUrl: null, specialtyName: "Dermatology", specialtySlug: "dermatology", isDemo: true },
  { id: "20000000-0000-4000-8000-000000000004", displayName: "Dr. Sami Example", biography: "Fictional sample profile to preview the directory and provider page.", qualifications: null, websiteUrl: null, consultationFee: 400000, appointmentDurationMinutes: 30, bufferMinutes: 10, timezone: "Asia/Karachi", imageUrl: null, specialtyName: "Pediatrics", specialtySlug: "pediatrics", isDemo: true },
] as const;

export function demoDataEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.USE_DEMO_DATA === "true";
}
