import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { siteConfig } from "/app/config/site";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function closeMenuOnResize() {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", closeMenuOnResize);

    return () => {
      window.removeEventListener("resize", closeMenuOnResize);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-taupe bg-cream/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] max-w-site items-center px-5 sm:px-8">
        <Link
          to="/"
          className="mr-auto flex items-center gap-3"
          aria-label={`${siteConfig.companyName} home`}
        >
          <img
            src="/images/ChatGPT Image Sep 27, 2026, 06_44_25 AM.png"
            alt="Solar Harbour company monogram"
            className="h-12 w-18 object-cover mix-blend-multiply"
          />

          <span className="flex flex-col leading-none">
            <strong className="font-heading text-2xl font-semibold">
              {siteConfig.shortName}
            </strong>

            <span className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-warmGray">
              Solar Harbour
            </span>
          </span>
        </Link>

        <nav
          className="mr-8 hidden items-center gap-8 lg:flex"
          aria-label="Primary navigation"
        >
          {siteConfig.navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                [
                  "border-b-2 px-1 py-7 text-sm font-medium transition-colors",
                  isActive
                    ? "border-gold text-charcoal"
                    : "border-transparent text-warmGray hover:text-charcoal"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/estimate"
          className="hidden min-h-11 items-center justify-center gap-2 bg-forest px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-charcoal lg:inline-flex"
        >
          Get an estimate
          <ArrowUpRight size={17} />
        </Link>

        <button
          type="button"
          className="ml-4 grid h-11 w-11 place-items-center border border-taupe bg-transparent text-charcoal lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="absolute left-0 right-0 top-[82px] border-b border-taupe bg-cream px-5 py-6 shadow-xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-site flex-col">
            {siteConfig.navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "border-b border-taupe py-4 text-base font-medium",
                    isActive
                      ? "text-forest"
                      : "text-charcoal"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/estimate"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 bg-forest px-5 text-sm font-semibold text-white"
            >
              Get an estimate
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;