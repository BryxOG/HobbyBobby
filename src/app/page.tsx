import { redirect } from "next/navigation";

/** The app has no landing page — Ивенты is the home tab. */
export default function Home() {
  redirect("/events");
}
