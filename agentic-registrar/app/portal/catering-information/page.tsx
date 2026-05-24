"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Catering Information"
      subtitle="This week's menu and dietary information"
      variant="info"
      intro="Three meals a day are served at the main canteen. Vegetarian and fasting options available every day."
      cards={[
        { title: "Monday", body: "Breakfast: scrambled eggs, bread, tea. Lunch: shiro, injera, salad. Dinner: pasta with tomato sauce, fruit." },
        { title: "Tuesday", body: "Breakfast: ful medames, bread, tea. Lunch: doro wat, injera. Dinner: rice with stir-fried vegetables." },
        { title: "Wednesday (fasting)", body: "Breakfast: oatmeal, fruit, tea. Lunch: misir wat, kik alicha, injera. Dinner: lentil soup, bread." },
        { title: "Thursday", body: "Breakfast: pancakes, fruit, tea. Lunch: tibs, injera, salad. Dinner: pasta arrabiata, bread." },
        { title: "Friday (fasting)", body: "Breakfast: foul, bread, tea. Lunch: shiro, gomen, injera. Dinner: vegetable soup, bread." },
        { title: "Weekend", body: "Brunch service 10:00–12:00; dinner 18:00–20:00. À la carte options at the cafeteria." },
      ]}
    />
  );
}
