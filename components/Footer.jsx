import { Link } from "react-router-dom";

import { siteConfig } from "../app/config/site";

function Footer() {
  return (
    <footer className="bg-[#19271F] pt-20 text-white">
      <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1.3fr_0.7fr]">
        <div>
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label={`${siteConfig.companyName} home`}
          >
            <span className="grid h-12 w-12 place-items-center border border-white/40 font-heading text-xl">
              {siteConfig.shortName}
            </span>

            <span className="flex flex-col leading-none">
              <strong className="font-heading text-2xl">
                {siteConfig.shortName}
              </strong>

              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Solar Harbour
              </span>
            </span>
          </Link>

          <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">
            Roofing, solar and impact-window solutions shaped around
            the way you live.
          </p>
        </div>

        <div>
          <FooterHeading>
            Explore
          </FooterHeading>

          <FooterLinks>
            <Link to="/about">About</Link>
            <Link to="/qualify">Qualify</Link>
            <Link to="/booking">Booking</Link>
            <Link to="/estimate">Estimate</Link>
          </FooterLinks>
        </div>

        <div>
          <FooterHeading>
            Contact
          </FooterHeading>

          <FooterLinks>
            <a href={`tel:${siteConfig.phoneLink}`}>
              {siteConfig.phoneDisplay}
            </a>

            <a href={`mailto:${siteConfig.generalEmail}`}>
              {siteConfig.generalEmail}
            </a>

            <span>
              {siteConfig.serviceArea}
            </span>
          </FooterLinks>
        </div>

        <div>
          <FooterHeading>
            Follow
          </FooterHeading>

          <div className="flex gap-3">
            <a
              href={siteConfig.socialLinks.instagram}
              aria-label="Instagram"
                target="_blank"
            >
              <img
                src="/public/instagram.png" 
                alt="Instagram" 
                className="h-10 w-10 transition hover:opacity-80" 
            />
            </a>

            <a
            href={siteConfig.socialLinks.facebook}
            aria-label="Facebook"
            target="_blank"
            rel="noopener noreferrer"
            >
            <img 
                src="/public/facebook.png" 
                alt="Facebook" 
                className="h-10 w-10 transition hover:opacity-80" 
            />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-site flex-col gap-4 border-t border-white/10 px-5 py-6 text-xs text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between">
        <span>
          © {new Date().getFullYear()} {siteConfig.companyName}.
          All rights reserved.
        </span>

        <div className="flex flex-wrap gap-6">
          <Link
            to="/privacy"
            className="transition hover:text-gold"
          >
            Privacy policy
          </Link>

          <a
            href={`mailto:${siteConfig.privacyEmail}`}
            className="transition hover:text-gold"
          >
            Privacy request
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }) {
  return (
    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
      {children}
    </p>
  );
}

function FooterLinks({ children }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-white/60 [&>a]:transition [&>a:hover]:text-gold">
      {children}
    </div>
  );
}

export default Footer;