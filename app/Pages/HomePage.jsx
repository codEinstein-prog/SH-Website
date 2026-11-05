import {
  ArrowRight,
  CheckCircle2,
  PanelsTopLeft,
  ScanLine,
  ShieldCheck,
  Sun
} from "lucide-react";

import { Link } from "react-router-dom";

import PrimaryButton from "/components/PrimaryButton";
import SectionHeading from "/components/SectionHeading";

const services = [
  {
    number: "01",
    title: "Roofing",
    icon: PanelsTopLeft,
    description:
      "New installations, replacements and resilient roofing systems delivered with close attention to structure, drainage and finish."
  },
  {
    number: "02",
    title: "Solar",
    icon: Sun,
    description:
      "Thoughtful solar and battery solutions designed around your property, energy use and long-term goals."
  },
  {
    number: "03",
    title: "Impact windows",
    icon: ScanLine,
    description:
      "Premium impact-resistant windows installed for stronger protection, improved efficiency and a refined exterior."
  }
];

const processSteps = [
  "Tell us about your property",
  "Confirm project fit and requirements",
  "Schedule your consultation",
  "Receive a tailored proposal"
];

const projects = [
  {
    category: "Solar · Residential",
    title: "Whole home energy upgrade",
    description:
      "Integrated solar array and exterior modernization.",
    image: "/images/pexels-rdne-8782730.jpg",
    imageAlt:
      "Modern coastal home with a roof-mounted solar array",
    featured: true
  },
  {
    category: "Roofing · Residential",
    title: "Coastal roof replacement",
    description:
      "A durable standing-seam roofing system with a clean architectural finish.",
    image: "/images/project-roof.png",
    imageAlt:
      "New charcoal standing-seam metal roof",
    featured: false
  },
  {
    category: "Windows · Residential",
    title: "Impact glass transformation",
    description:
      "Black framed impact windows designed for protection and natural light.",
    image: "/images/hurricane-impact-resistant-windows-and-doors-in-lantana.png",
    imageAlt:
      "Black-framed impact windows on a coastal home",
    featured: false
  }
];

function HomePage() {
  return (
    <>
      <HeroSection />

      <ServicesSection />

      <ProjectsSection />

      <ProcessSection />

      <CallToActionSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[690px] overflow-hidden text-white md:min-h-[760px]">
      <img
        src="/images/hero-home.png"
        alt="Contemporary coastal home with solar panels, metal roofing and impact windows"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1813]/90 via-[#0F1813]/55 to-[#0F1813]/10" />

      <div className="relative mx-auto flex min-h-[690px] max-w-site flex-col justify-center px-5 pb-40 pt-24 sm:px-8 md:min-h-[760px] md:pb-28">
        <div className="max-w-4xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#E7C995]">
            Roofing · Solar · Impact windows
          </p>

          <h1 className="font-heading text-[4rem] font-semibold leading-[0.85] tracking-[-0.055em] sm:text-7xl md:text-8xl lg:text-[7.5rem]">
            Built to protect.
            <br />

            <em className="font-medium text-[#EAD4AB]">
              Designed to last.
            </em>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-white/75 md:text-lg">
            One trusted team for the systems that protect, power and
            elevate your property.
          </p>

          <div className="mt-9 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <PrimaryButton
              to="/booking"
              variant="gold"
            >
              Book a consultation
            </PrimaryButton>

            <a
              href="#selected-work"
              className="inline-flex items-center gap-2 border-b border-gold pb-1 text-sm font-semibold text-white"
            >
              Explore our work
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-4 right-4 flex items-center gap-4 bg-cream px-5 py-5 text-charcoal sm:left-auto sm:right-0 sm:max-w-md sm:px-8">
        <ShieldCheck
          size={30}
          className="shrink-0 text-gold"
        />

        <span className="flex flex-col">
          <strong className="text-sm">
            Built with care
          </strong>

          <span className="mt-1 text-xs text-warmGray">
            Clear guidance from consultation to completion
          </span>
        </span>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="bg-cream py-24 md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-8">
        <SectionHeading
          eyebrow="Our expertise"
          title={
            <>
              Three essential systems.
              <br />
              One exacting standard.
            </>
          }
          description="We approach every property as a whole, balancing protection, efficiency and architectural character."
        />

        <div className="grid border-t border-taupe lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="group border-b border-l border-r border-taupe px-7 py-10 transition duration-300 hover:-translate-y-1 hover:bg-white lg:border-l-0 lg:border-r lg:px-9 lg:py-12 lg:first:border-l"
              >
                <div className="flex items-start justify-between text-gold">
                  <span className="text-xs font-semibold">
                    {service.number}
                  </span>

                  <Icon
                    size={32}
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="mt-12 font-heading text-4xl font-semibold text-charcoal">
                  {service.title}
                </h3>

                <p className="mt-5 min-h-[110px] text-sm leading-7 text-warmGray">
                  {service.description}
                </p>

                <Link
                  to="/qualify"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-charcoal"
                >
                  Check your project
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section
      id="selected-work"
      className="scroll-mt-24 bg-forest py-24 text-white md:py-28"
    >
      <div className="mx-auto max-w-site px-5 sm:px-8">
        <SectionHeading
          light
          eyebrow="Selected work"
          title={
            <>
              Made for real homes.
              <br />
              Finished beautifully.
            </>
          }
          description="Representative project imagery."
        />

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:grid-rows-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.title}
              project={project}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  return (
    <article
      className={[
        "group relative min-h-[340px] overflow-hidden",
        project.featured
          ? "lg:row-span-2 lg:min-h-[680px]"
          : "lg:min-h-[330px]"
      ].join(" ")}
    >
      <img
        src={project.image}
        alt={project.imageAlt}
        loading={project.featured ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1712]/90 via-[#0F1712]/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E8C98E]">
          {project.category}
        </p>

        <h3 className="mt-2 font-heading text-3xl font-semibold text-white sm:text-4xl">
          {project.title}
        </h3>

        {project.description && (
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}

function ProcessSection() {
  return (
    <section className="bg-cream py-24 md:py-28">
      <div className="mx-auto grid max-w-site gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-28">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
            A clear process
          </p>

          <h2 className="font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-6xl">
            Know what
            <br />
            comes next.
          </h2>

          <p className="mt-7 max-w-lg leading-7 text-warmGray">
            Good work starts with a useful conversation. We review
            the property, define the appropriate solution and make
            every stage understandable.
          </p>

          <Link
            to="/about"
            className="mt-7 inline-flex items-center gap-2 border-b border-gold pb-1 text-sm font-semibold"
          >
            How we work
            <ArrowRight size={16} />
          </Link>
        </div>

        <ol className="border-t border-taupe">
          {processSteps.map((step, index) => (
            <li
              key={step}
              className="grid grid-cols-[48px_1fr_auto] items-center gap-2 border-b border-taupe py-6"
            >
              <span className="text-xs font-semibold text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>

              <strong className="font-heading text-2xl font-semibold sm:text-3xl">
                {step}
              </strong>

              <CheckCircle2
                size={23}
                className="text-forest"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CallToActionSection() {
  return (
    <section className="bg-cream pb-24 md:pb-28">
      <div className="mx-auto max-w-site px-5 sm:px-8">
        <div className="flex flex-col gap-10 bg-forest px-6 py-12 text-white sm:px-10 md:p-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#E7C995]">
              Your project starts here
            </p>

            <h2 className="font-heading text-5xl font-semibold leading-[0.95] sm:text-6xl">
              Ready to improve
              <br />
              your home?
            </h2>

            <p className="mt-6 max-w-2xl leading-7 text-white/65">
              Answer a few questions to see whether your project is
              a fit, or create a preliminary estimate to start the
              conversation.
            </p>
          </div>

          <div className="flex min-w-[220px] flex-col gap-3">
            <PrimaryButton
              to="/qualify"
              variant="gold"
            >
              See if you qualify
            </PrimaryButton>

            <PrimaryButton
              to="/estimate"
              variant="light"
              showArrow={false}
            >
              Build an estimate
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;