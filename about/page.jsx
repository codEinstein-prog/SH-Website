import {
  ArrowRight,
  ClipboardCheck,
  Hammer,
  Handshake,
  Search,
  ShieldCheck
} from "lucide-react";

import { Link } from "react-router-dom";

import ContentSection from "/components/ContentSection";
import PageHero from "/components/PageHero";
import PrimaryButton from "/components/PrimaryButton";
import SectionHeading from "/components/SectionHeading";

const values = [
  {
    title: "Clarity",
    icon: ClipboardCheck,
    description:
      "Useful guidance, honest expectations and project information explained without unnecessary complexity."
  },
  {
    title: "Craft",
    icon: Hammer,
    description:
      "Careful planning and detail-oriented work designed to perform well and look considered."
  },
  {
    title: "Stewardship",
    icon: ShieldCheck,
    description:
      "Respect for the property, the client's investment and the long-term value of every recommendation."
  }
];

const projectProcess = [
  {
    number: "01",
    title: "Initial conversation",
    icon: Handshake,
    description:
      "We begin by understanding the property, the service required and the client's primary objectives."
  },
  {
    number: "02",
    title: "Project qualification",
    icon: ClipboardCheck,
    description:
      "We review ownership, location, timeline, budget and service requirements to determine project fit."
  },
  {
    number: "03",
    title: "Property assessment",
    icon: Search,
    description:
      "A consultation or site visit allows the team to review measurements, conditions and technical requirements."
  },
  {
    number: "04",
    title: "Tailored proposal",
    icon: Hammer,
    description:
      "The client receives a proposal based on the confirmed scope, specifications, materials and project schedule."
  }
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Better homes begin with better decisions."
        description="We bring roofing, solar and impact-window expertise together to help property owners plan with clarity and build with confidence."
        image="/images/hero-home.png"
        imageAlt="Contemporary home with roofing, solar panels and impact windows"
      />

      <CompanyIntroduction />

      <ValuesSection />

      <ProcessSection />

      <AboutCallToAction />
    </>
  );
}

function CompanyIntroduction() {
  return (
    <ContentSection>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
            Our story
          </p>

          <h2 className="font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.035em] text-charcoal sm:text-6xl">
            A considered approach to every property.
          </h2>

          <div className="mt-8 space-y-5 leading-8 text-warmGray">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. We believe the strongest projects
              begin by understanding how a home performs as a
              complete system.
            </p>

            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris. From the first
              consultation through final review, our focus remains
              on clear communication, sound recommendations and
              dependable workmanship.
            </p>
          </div>

          <Link
            to="/booking"
            className="mt-8 inline-flex items-center gap-2 border-b border-gold pb-1 text-sm font-semibold text-charcoal"
          >
            Start a conversation
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative">
          <img
            src="/images/project-windows.png"
            alt="Modern impact-window installation"
            className="h-[440px] w-full object-cover sm:h-[540px]"
          />

          <div className="absolute -bottom-7 left-5 right-5 bg-forest p-6 text-white sm:left-auto sm:right-[-20px] sm:max-w-xs sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E7C995]">
              Our approach
            </p>

            <p className="mt-4 font-heading text-2xl font-semibold leading-tight">
              Protection, efficiency and design considered together.
            </p>
          </div>
        </div>
      </div>
    </ContentSection>
  );
}

function ValuesSection() {
  return (
    <ContentSection className="pt-10 md:pt-14">
      <SectionHeading
        eyebrow="What guides us"
        title="Built around trust."
        description="These principles shape how we advise, plan and carry out every project."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {values.map((value) => {
          const Icon = value.icon;

          return (
            <article
              key={value.title}
              className="border-t-4 border-gold bg-white p-8 shadow-[0_20px_50px_rgba(28,28,26,0.04)]"
            >
              <Icon
                size={30}
                strokeWidth={1.5}
                className="text-forest"
              />

              <h3 className="mt-8 font-heading text-4xl font-semibold text-charcoal">
                {value.title}
              </h3>

              <p className="mt-5 text-sm leading-7 text-warmGray">
                {value.description}
              </p>
            </article>
          );
        })}
      </div>
    </ContentSection>
  );
}

function ProcessSection() {
  return (
    <section className="bg-forest py-20 text-white md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-8">
        <SectionHeading
          light
          eyebrow="How we work"
          title={
            <>
              A disciplined process
              <br />
              from idea to installation.
            </>
          }
          description="Each stage is designed to confirm the right solution before major project commitments are made."
        />

        <div className="grid gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-2">
          {projectProcess.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="bg-forest p-7 sm:p-9"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#E7C995]">
                    {step.number}
                  </span>

                  <Icon
                    size={29}
                    strokeWidth={1.5}
                    className="text-[#E7C995]"
                  />
                </div>

                <h3 className="mt-10 font-heading text-3xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutCallToAction() {
  return (
    <ContentSection>
      <div className="grid gap-10 border border-taupe bg-white p-7 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end lg:p-16">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
            Plan your project
          </p>

          <h2 className="max-w-3xl font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-6xl">
            Let’s determine the right next step for your property.
          </h2>

          <p className="mt-6 max-w-2xl leading-7 text-warmGray">
            Complete the qualification questionnaire before booking
            a site visit. This helps the team understand the scope,
            timing and requirements of your project.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <PrimaryButton
            to="/qualify"
            variant="dark"
          >
            Check qualification
          </PrimaryButton>

          <PrimaryButton
            to="/booking"
            variant="gold"
          >
            Book a consultation
          </PrimaryButton>
        </div>
      </div>
    </ContentSection>
  );
}

export default AboutPage;