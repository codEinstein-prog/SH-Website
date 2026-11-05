import { Outlet } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default SiteLayout;