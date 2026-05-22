import { getEventById } from "@/app/services/apis";
import EventDisplayClient from "@/app/HomeComponents/Rsvp";
import { notFound } from "next/navigation";
import { EstateEvent } from "@/app/services/types";

interface PageProps {
  params: { id: string };
}

export default async function EventRSVPPage({ params }: PageProps) {
  const { id } = await params;

  return <EventDisplayClient eventRef={id} />;
}
