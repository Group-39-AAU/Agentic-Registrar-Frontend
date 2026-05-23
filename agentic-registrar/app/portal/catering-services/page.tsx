"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Catering Services"
      subtitle="Where to eat on campus, service hours, and how to opt in"
      variant="info"
      cards={[
        { title: "Main Canteen", body: "Block A · open 06:30–21:00 daily. Self-service buffet at lunch and dinner." },
        { title: "Snack Bar", body: "Library lobby · open 08:00–18:00 weekdays. Coffee, sandwiches, light meals." },
        { title: "Special diets", body: "Vegan, gluten-free, and medically required diets can be arranged with 48 hours notice." },
        { title: "Opt-in", body: "Boarders are auto-enrolled. Day students may opt in via the registrar's office." },
      ]}
      rows={[
        { label: "Service location", value: "Main campus, Block A" },
        { label: "Contact", value: "catering@aau.edu.et" },
        { label: "Phone", value: "+251 9xx xxx xxx" },
      ]}
    />
  );
}
