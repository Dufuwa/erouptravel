import { redirect } from "next/navigation";
import { TRIP_ID } from "@/data/seed";

export default function Home() { redirect(`/trip/${TRIP_ID}/today`); }
