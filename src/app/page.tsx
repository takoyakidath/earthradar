import Sidebar from "@/components/sidebar";
import Map from "@/components/map";
import { EarthquakeFeedProvider } from "@/contexts/EarthquakeFeedProvider";

export default function Home() {
  return (
    <EarthquakeFeedProvider>
      <Sidebar>
        <Map />
      </Sidebar>
    </EarthquakeFeedProvider>
  );
}
