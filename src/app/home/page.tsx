import { getHomeInitialData } from "@/lib/home";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
    const now = new Date();
    const initialData = await getHomeInitialData(
        now.getFullYear(),
        now.getMonth() + 1
    );

    return <HomePageClient initialData={initialData} />;
}
