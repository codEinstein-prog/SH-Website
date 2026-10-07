import { Route, Routes } from "react-router-dom";

import ScrollToTop from "/components/ScrollToTop";
import SiteLayout from "/components/SiteLayout";

import HomePage from "./Pages/HomePage";
import AboutPage from "./Pages/about/page.jsx";
import QualifyPage from "./Pages/qualify/page.jsx";
import BookingPage from "./Pages/booking/page.jsx";
import EstimatePage from "./Pages/estimate/page.jsx";
import PrivacyPage from "./Pages/privacy/page.jsx";
import NotFoundPage from "./Pages/NotFoundPage";

function App() {
  return (
    <>
      <ScrollToTop />
      <WhatsAppChat />
      <ReferralWidget />

      <Routes>
        <Route element={<SiteLayout />}>
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/about"
            element={<AboutPage />}
          />

          <Route
            path="/qualify"
            element={<QualifyPage />}
          />

          <Route
            path="/booking"
            element={<BookingPage />}
          />

          <Route
            path="/estimate"
            element={<EstimatePage />}
          />

          <Route
            path="/privacy"
            element={<PrivacyPage />}
          />

          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
