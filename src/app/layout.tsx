import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pursuit Clinics | Find thoughtful care",
  description: "Find a doctor you trust and book an appointment that fits your life.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#43c6ad",
              colorPrimaryForeground: "#071411",
              colorBackground: "#11191e",
              colorInput: "#172229",
              colorInputForeground: "#eef5f3",
              colorForeground: "#eef5f3",
              colorMutedForeground: "#9aa9ad",
              colorBorder: "#26343a",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
