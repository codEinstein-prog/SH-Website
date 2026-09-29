import { Link } from "react-router-dom";

import ContentSection from "/components/ContentSection";
import PageHero from "/components/PageHero";
import { siteConfig } from "/app/config/site";

const effectiveDate = "September 23, 2026";

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="A plain-language description of how information submitted through this website may be collected, used and protected."
        image="/images/hero-home.png"
        imageAlt="Contemporary residential property"
      />

      <ContentSection>
        <article className="mx-auto max-w-4xl">
          <div className="border border-taupe bg-white p-6 sm:p-8">
            <p className="font-semibold text-charcoal">
              Important implementation notice
            </p>

            <p className="mt-3 text-sm leading-7 text-warmGray">
              This page is a general website privacy-policy template
              and does not constitute legal advice. Before launch,
              replace all bracketed placeholders, confirm the
              company’s actual practices and vendors, identify the
              jurisdictions where the business operates and obtain
              appropriate legal review.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-b border-taupe pb-8 text-sm text-warmGray sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong className="text-charcoal">
                Effective date:
              </strong>{" "}
              {effectiveDate}
            </span>

            <a
              href={`mailto:${siteConfig.privacyEmail}`}
              className="font-semibold text-forest underline"
            >
              Submit a privacy request
            </a>
          </div>

          <PolicySection title="1. Scope">
            <p>
              This Privacy Policy explains how{" "}
              {siteConfig.companyName} (“Company,” “we,” “us” or
              “our”) may collect, use, disclose, retain and protect
              personal information when you:
            </p>

            <ul>
              <li>Visit or interact with this website.</li>
              <li>Complete a project-qualification questionnaire.</li>
              <li>Request a preliminary project estimate.</li>
              <li>Request a consultation or site visit.</li>
              <li>Contact the Company by telephone or email.</li>
              <li>Otherwise communicate with the Company.</li>
            </ul>

            <p>
              This policy applies only to information handled by the
              Company through the services described above. External
              websites and third-party platforms may maintain their
              own privacy policies.
            </p>
          </PolicySection>

          <PolicySection title="2. Information we may collect">
            <PolicySubheading>
              Information you provide
            </PolicySubheading>

            <p>
              Depending on the service you request, we may collect:
            </p>

            <ul>
              <li>Your name.</li>
              <li>Email address.</li>
              <li>Telephone number.</li>
              <li>Preferred contact method.</li>
              <li>Property address or ZIP code.</li>
              <li>Property type and ownership status.</li>
              <li>Requested service.</li>
              <li>Project budget and preferred timeline.</li>
              <li>
                Roofing type, size, condition and related project
                information.
              </li>
              <li>
                Electricity usage, solar objectives and battery
                requirements.
              </li>
              <li>
                Window quantities, approximate measurements and
                construction details.
              </li>
              <li>Appointment preferences.</li>
              <li>
                Photographs, documents or additional information you
                choose to submit.
              </li>
            </ul>

            <PolicySubheading>
              Information collected automatically
            </PolicySubheading>

            <p>
              When analytics, security or operational services are
              enabled, the website or its providers may automatically
              receive certain technical information, including:
            </p>

            <ul>
              <li>IP address.</li>
              <li>Browser type.</li>
              <li>Device type and operating system.</li>
              <li>Approximate geographic location.</li>
              <li>Pages viewed and links selected.</li>
              <li>Visit date and duration.</li>
              <li>Referral source.</li>
              <li>
                Cookie or similar-technology identifiers.
              </li>
              <li>
                Security, diagnostic and error information.
              </li>
            </ul>

            <p>
              The live policy should identify the specific analytics,
              advertising, security and form-processing tools that
              are actually enabled.
            </p>
          </PolicySection>

          <PolicySection title="3. How we may use information">
            <p>
              We may use personal information to:
            </p>

            <ul>
              <li>Respond to questions and service inquiries.</li>
              <li>
                Determine whether a project meets our service and
                qualification requirements.
              </li>
              <li>
                Prepare preliminary estimates and project proposals.
              </li>
              <li>
                Schedule consultations, assessments and site visits.
              </li>
              <li>
                Communicate about requested or ongoing services.
              </li>
              <li>
                Maintain appropriate business and project records.
              </li>
              <li>
                Operate, secure, troubleshoot and improve the website.
              </li>
              <li>
                Measure website traffic and performance where
                analytics is enabled.
              </li>
              <li>
                Prevent fraud, misuse and unauthorized activity.
              </li>
              <li>
                Meet applicable legal, accounting and regulatory
                requirements.
              </li>
              <li>
                Establish, exercise or defend legal rights.
              </li>
            </ul>

            <p>
              Consent to respond to an inquiry is not automatically
              treated as consent to unrelated promotional email or
              text messages. Separate consent should be obtained
              where applicable.
            </p>
          </PolicySection>

          <PolicySection title="4. How information may be disclosed">
            <p>
              We may disclose information to the following
              categories of recipients when reasonably necessary:
            </p>

            <ul>
              <li>
                Website-hosting and content-delivery providers.
              </li>
              <li>
                Form, scheduling and customer-management providers.
              </li>
              <li>
                Email, telephone and communication providers.
              </li>
              <li>
                Analytics, security and fraud-prevention providers.
              </li>
              <li>
                Contractors assisting with a requested project.
              </li>
              <li>
                Accountants, insurers, attorneys and professional
                advisers.
              </li>
              <li>
                Government authorities or other parties when required
                by law.
              </li>
              <li>
                A buyer or successor in connection with a business
                sale, merger, restructuring or transfer.
              </li>
            </ul>

            <p>
              Service providers should receive only the information
              reasonably necessary for their role and should be
              subject to appropriate privacy and security
              obligations.
            </p>
          </PolicySection>

          <PolicySection title="5. Sale or sharing of personal information">
            <p>
              The Company does not sell personal information for
              money.
            </p>

            <p>
              Certain state privacy laws may define “sale” or
              “sharing” more broadly than an exchange for money. For
              example, some analytics or targeted-advertising
              activities may fall within those definitions.
            </p>

            <p>
              Before enabling advertising cookies, cross-context
              behavioral advertising or similar technologies, the
              Company should determine whether an opt-out mechanism,
              “Do Not Sell or Share My Personal Information” link or
              recognition of browser-based privacy signals is
              required.
            </p>
          </PolicySection>

          <PolicySection title="6. Cookies and similar technologies">
            <p>
              The production website may use cookies and similar
              technologies for:
            </p>

            <ul>
              <li>Essential website operation.</li>
              <li>Security and fraud prevention.</li>
              <li>Remembering visitor preferences.</li>
              <li>Measuring traffic and website performance.</li>
              <li>
                Supporting connected booking, form or media services.
              </li>
            </ul>

            <p>
              Optional analytics, advertising or embedded-service
              cookies should not be enabled until the Company has
              confirmed its vendors, disclosure obligations and any
              required consent or preference mechanism.
            </p>

            <p>
              Visitors may also control cookies through their browser
              settings. Disabling certain technologies may affect
              website functionality.
            </p>
          </PolicySection>

          <PolicySection title="7. Connected services">
            <p>
              The website may link to or integrate third-party
              services such as:
            </p>

            <ul>
              <li>Calendly or another appointment platform.</li>
              <li>Google Forms or another form provider.</li>
              <li>Google Analytics.</li>
              <li>Google Maps.</li>
              <li>Cloudflare hosting and security services.</li>
              <li>Email or customer-management platforms.</li>
              <li>Social-media services.</li>
            </ul>

            <p>
              These services may process information according to
              their own privacy policies. The Company should remove
              services from this list that are not used and add any
              active provider that is missing.
            </p>
          </PolicySection>

          <PolicySection title="8. Data retention">
            <p>
              We retain information only for as long as reasonably
              necessary for the purposes described in this policy.
              This may include the period needed to:
            </p>

            <ul>
              <li>Respond to an inquiry.</li>
              <li>Evaluate or perform a requested project.</li>
              <li>Maintain warranty and service records.</li>
              <li>Meet accounting and recordkeeping requirements.</li>
              <li>Resolve disputes.</li>
              <li>Enforce agreements.</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <p>
              Before launch, the Company should establish actual
              retention periods for qualification submissions,
              booking requests, estimates, project records and
              analytics information.
            </p>
          </PolicySection>

          <PolicySection title="9. Data security">
            <p>
              We use reasonable administrative, technical and
              organizational safeguards appropriate to the
              information we process. These safeguards may include
              access restrictions, secure connections, account
              controls, software updates and service-provider review.
            </p>

            <p>
              No website, transmission or storage system can be
              guaranteed completely secure. Visitors should not
              submit Social Security numbers, banking credentials,
              account passwords, medical information or other
              unnecessary sensitive information through general
              website forms.
            </p>
          </PolicySection>

          <PolicySection title="10. Your privacy choices">
            <p>
              Depending on where you live, the Company’s size and
              whether a particular privacy law applies, you may have
              rights to request:
            </p>

            <ul>
              <li>
                Confirmation of whether personal information is being
                processed.
              </li>
              <li>
                Access to certain personal information.
              </li>
              <li>
                Correction of inaccurate information.
              </li>
              <li>
                Deletion of certain information.
              </li>
              <li>
                A portable copy of certain information.
              </li>
              <li>
                Opt-out from certain sales, sharing, targeted
                advertising or profiling.
              </li>
              <li>
                Limitation of certain uses of sensitive personal
                information.
              </li>
              <li>
                An appeal after a privacy request is denied, where
                required.
              </li>
            </ul>

            <p>
              These rights may be subject to legal exceptions. The
              Company may need to verify your identity before
              processing a request.
            </p>

            <p>
              To submit a request, contact{" "}
              <a
                href={`mailto:${siteConfig.privacyEmail}`}
                className="font-semibold text-forest underline"
              >
                {siteConfig.privacyEmail}
              </a>
              .
            </p>

            <p>
              The Company will not unlawfully discriminate against
              someone for exercising an applicable privacy right.
            </p>
          </PolicySection>

          <PolicySection title="11. California privacy notice">
            <p>
              If the California Consumer Privacy Act applies to the
              Company, California residents may receive additional
              disclosures and rights.
            </p>

            <p>
              Categories of information potentially collected through
              this website may include:
            </p>

            <ul>
              <li>Identifiers and contact information.</li>
              <li>Property and project information.</li>
              <li>Commercial information and service interests.</li>
              <li>
                Internet or electronic network activity.
              </li>
              <li>Approximate location information.</li>
              <li>
                Inferences based on submitted project information.
              </li>
            </ul>

            <p>
              This information may be used and disclosed for the
              business purposes described in this policy. Where
              required, a notice at collection should be presented at
              or before each point where personal information is
              collected.
            </p>

            <p>
              If the Company later sells or shares personal
              information as those terms are defined by California
              law, the website and this policy must be updated with
              any required opt-out method.
            </p>
          </PolicySection>

          <PolicySection title="12. Children’s privacy">
            <p>
              This website and its services are intended for property
              owners, authorized representatives and other adults.
              They are not directed to children under 13.
            </p>

            <p>
              We do not knowingly collect personal information online
              from children under 13. If the Company learns that such
              information has been collected, it will take reasonable
              steps to delete it. A parent or legal guardian may
              contact us using the information below.
            </p>
          </PolicySection>

          <PolicySection title="13. External websites">
            <p>
              This website may contain links to websites operated by
              other organizations. The Company does not control those
              websites and is not responsible for their content,
              security or privacy practices.
            </p>

            <p>
              Visitors should review the privacy notice of any
              external service before providing personal information.
            </p>
          </PolicySection>

          <PolicySection title="14. Changes to this policy">
            <p>
              We may update this Privacy Policy when our services,
              data practices, vendors or legal obligations change.
            </p>

            <p>
              The revised policy will be posted on this page with an
              updated effective date. Additional notice will be
              provided when required by applicable law.
            </p>
          </PolicySection>

          <PolicySection title="15. Contact us">
            <div className="border-l-4 border-gold bg-white p-6">
              <p className="font-semibold text-charcoal">
                {siteConfig.companyName}
              </p>

              <p className="mt-3">
                Legal company name: [INSERT LEGAL NAME]
              </p>

              <p>
                Mailing address: [INSERT BUSINESS ADDRESS]
              </p>

              <p>
                Service area: [INSERT SERVICE AREA]
              </p>

              <p>
                Telephone:{" "}
                <a
                  href={`tel:${siteConfig.phoneLink}`}
                  className="font-semibold text-forest underline"
                >
                  {siteConfig.phoneDisplay}
                </a>
              </p>

              <p>
                Privacy email:{" "}
                <a
                  href={`mailto:${siteConfig.privacyEmail}`}
                  className="font-semibold text-forest underline"
                >
                  {siteConfig.privacyEmail}
                </a>
              </p>
            </div>
          </PolicySection>

          <div className="mt-16 border-t border-taupe pt-8">
            <Link
              to="/"
              className="font-semibold text-forest underline"
            >
              Return to the home page
            </Link>
          </div>
        </article>
      </ContentSection>
    </>
  );
}

function PolicySection({
  title,
  children
}) {
  return (
    <section className="border-b border-taupe py-10">
      <h2 className="font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
        {title}
      </h2>

      <div className="mt-6 space-y-5 leading-8 text-warmGray [&_li]:pl-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

function PolicySubheading({
  children
}) {
  return (
    <h3 className="pt-3 font-heading text-2xl font-semibold text-charcoal sm:text-3xl">
      {children}
    </h3>
  );
}

export default PrivacyPage;