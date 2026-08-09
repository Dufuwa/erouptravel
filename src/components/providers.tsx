"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { TripProvider } from "@/contexts/trip-context";
import { ServiceWorkerRegister } from "./service-worker-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider><TripProvider>{children}<Toaster richColors position="top-center" /><ServiceWorkerRegister /></TripProvider></AuthProvider>;
}
