import { useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ShieldCheck
} from "lucide-react";

import { Link } from "react-router-dom";

import ContentSection from "/components/ContentSection";
import PageHero from "/components/PageHero";
import PrimaryButton from "/components/PrimaryButton";

const initialFormData = {
  service: "",
  propertyType: "",
  ownership: "",

  timeline: "",
  budget: "",
  projectDescription: "",

  roofType: "",
  roofSize: "",
  roofCondition: "",

  electricityBill: "",
  solarRoofType: "",
  batteryBackup: "",

  windowQuantity: "",
  constructionType: "",
  windowDimensions: "",

  fullName: "",
  email: "",
  phone: "",
  zipCode: "",
  preferredContact: "",
  creditScore: "",

  privacyConsent: false
};

function QualifyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value
    }));

    setFormError("");
  }

  function validateStep() {
    if (currentStep === 1) {
      if (
        !formData.service ||
        !formData.propertyType ||
        !formData.ownership
      ) {
        setFormError(
          "Please complete all project and property questions."
        );

        return false;
      }
    }

    if (currentStep === 2) {
      if (
        !formData.timeline ||
        !formData.budget ||
        !formData.projectDescription
      ) {
        setFormError(
          "Please provide the project timeline, budget and description."
        );

        return false;
      }

      if (
        formData.service === "Roofing" &&
        (
          !formData.roofType ||
          !formData.roofSize ||
          !formData.roofCondition
        )
      ) {
        setFormError(
          "Please complete the roofing qualification questions."
        );

        return false;
      }

      if (
        formData.service === "Solar" &&
        (
          !formData.electricityBill ||
          !formData.solarRoofType ||
          !formData.batteryBackup
        )
      ) {
        setFormError(
          "Please complete the solar qualification questions."
        );

        return false;
      }

      if (
        formData.service === "Impact windows" &&
        (
          !formData.windowQuantity ||
          !formData.constructionType
        )
      ) {
        setFormError(
          "Please complete the impact-window qualification questions."
        );

        return false;
      }
    }

    if (currentStep === 3) {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.phone ||
        !formData.zipCode ||
        !formData.preferredContact
      ) {
        setFormError(
          "Please complete all required contact information."
        );

        return false;
      }

      if (!formData.privacyConsent) {
        setFormError(
          "You must acknowledge the Privacy Policy before submitting."
        );

        return false;
      }
    }

    setFormError("");
    return true;
  }

  function goToNextStep() {
    if (!validateStep()) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, 3));
  }

  function goToPreviousStep() {
    setFormError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateStep()) {
      return;
    }

    /*
     * Connect the form to your backend, Google Apps Script,
     * Formspree, Supabase or CRM here.
     *
     * Example:
     *
     * await fetch("YOUR_API_ENDPOINT", {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json"
     *   },
     *   body: JSON.stringify(formData)
     * });
     */

    console.log("Qualification submission:", formData);

    setSubmitted(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Project qualification"
        title="Let’s see if your project is a fit."
        description="Share a few practical details. We’ll use them only to understand your needs and recommend the appropriate next step."
        image="/images/project-roof.png"
        imageAlt="Premium residential roofing installation"
      />

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <QualificationIntroduction />

          <div className="border border-taupe bg-white p-5 sm:p-8 lg:p-11">
            {submitted ? (
              <QualificationSuccess />
            ) : (
              <form onSubmit={handleSubmit}>
                <ProgressIndicator
                  currentStep={currentStep}
                />

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gold">
                    Step {currentStep} of 3
                  </p>

                  <h2 className="mt-3 font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
                    {getStepTitle(currentStep)}
                  </h2>
                </div>

                {currentStep === 1 && (
                  <ProjectDetailsStep
                    formData={formData}
                    handleChange={handleChange}
                  />
                )}

                {currentStep === 2 && (
                  <ProjectRequirementsStep
                    formData={formData}
                    handleChange={handleChange}
                  />
                )}

                {currentStep === 3 && (
                  <ContactDetailsStep
                    formData={formData}
                    handleChange={handleChange}
                  />
                )}

                {formError && (
                  <div
                    role="alert"
                    className="mt-6 border-l-4 border-red-600 bg-red-50 px-5 py-4 text-sm text-red-800"
                  >
                    {formError}
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-taupe pt-7 sm:flex-row sm:items-center sm:justify-between">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-taupe px-6 text-sm font-semibold text-charcoal transition hover:bg-cream"
                    >
                      <ChevronLeft size={17} />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="inline-flex min-h-[50px] items-center justify-center gap-2 bg-forest px-7 text-sm font-semibold text-white transition hover:bg-charcoal"
                    >
                      Continue
                      <ChevronRight size={17} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex min-h-[50px] items-center justify-center gap-2 bg-forest px-7 text-sm font-semibold text-white transition hover:bg-charcoal"
                    >
                      Complete qualification
                      <ChevronRight size={17} />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </ContentSection>
    </>
  );
}

function QualificationIntroduction() {
  return (
    <aside>
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
        Before you book
      </p>

      <h2 className="font-heading text-5xl font-semibold leading-[0.95] text-charcoal sm:text-6xl">
        A few details save everyone time.
      </h2>

      <p className="mt-7 leading-7 text-warmGray">
        This questionnaire helps the team understand property
        ownership, service requirements, timing and budget before a
        consultation or site visit is scheduled.
      </p>

      <div className="mt-9 space-y-5">
        <InformationItem
          icon={ClipboardCheck}
          title="Simple questionnaire"
          description="Usually takes approximately three to five minutes."
        />

        <InformationItem
          icon={Clock3}
          title="Faster review"
          description="The team receives the basic project information before contacting you."
        />

        <InformationItem
          icon={ShieldCheck}
          title="Privacy considered"
          description="Your information is used to evaluate and respond to your inquiry."
        />
      </div>
    </aside>
  );
}

function InformationItem({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center bg-sage/40 text-forest">
        <Icon
          size={21}
          strokeWidth={1.7}
        />
      </span>

      <span>
        <strong className="block text-sm text-charcoal">
          {title}
        </strong>

        <span className="mt-1 block text-sm leading-6 text-warmGray">
          {description}
        </span>
      </span>
    </div>
  );
}

function ProgressIndicator({ currentStep }) {
  return (
    <div
      className="mb-9 grid grid-cols-3 gap-2"
      aria-label={`Step ${currentStep} of 3`}
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={[
            "h-1",
            step <= currentStep
              ? "bg-gold"
              : "bg-taupe"
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function ProjectDetailsStep({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-charcoal">
          Which service do you need? *
        </legend>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Roofing",
            "Solar",
            "Impact windows"
          ].map((service) => (
            <label
              key={service}
              className={[
                "flex min-h-[64px] cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition",
                formData.service === service
                  ? "border-forest bg-sage/30"
                  : "border-taupe bg-[#FBFAF7] hover:border-dustySage"
              ].join(" ")}
            >
              <input
                type="radio"
                name="service"
                value={service}
                checked={formData.service === service}
                onChange={handleChange}
                className="accent-forest"
              />

              <span>
                {service}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Property type"
          htmlFor="propertyType"
          required
        >
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select property type
            </option>

            <option value="Single-family home">
              Single-family home
            </option>

            <option value="Multi-family property">
              Multi-family property
            </option>

            <option value="Commercial property">
              Commercial property
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </FormField>

        <FormField
          label="Do you own the property?"
          htmlFor="ownership"
          required
        >
          <select
            id="ownership"
            name="ownership"
            value={formData.ownership}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select one
            </option>

            <option value="Yes">
              Yes
            </option>

            <option value="Under contract">
              Property is under contract
            </option>

            <option value="Authorized representative">
              I am an authorized representative
            </option>

            <option value="No">
              No
            </option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function ProjectRequirementsStep({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-6">
      {formData.service === "Roofing" && (
        <RoofingQuestions
          formData={formData}
          handleChange={handleChange}
        />
      )}

      {formData.service === "Solar" && (
        <SolarQuestions
          formData={formData}
          handleChange={handleChange}
        />
      )}

      {formData.service === "Impact windows" && (
        <ImpactWindowQuestions
          formData={formData}
          handleChange={handleChange}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Preferred project timeline"
          htmlFor="timeline"
          required
        >
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select timeline
            </option>

            <option value="As soon as possible">
              As soon as possible
            </option>

            <option value="1–3 months">
              1–3 months
            </option>

            <option value="3–6 months">
              3–6 months
            </option>

            <option value="Planning ahead">
              Planning ahead
            </option>
          </select>
        </FormField>

        <FormField
          label="Approximate project budget"
          htmlFor="budget"
          required
        >
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select budget range
            </option>

            <option value="Under $10,000">
              Under $10,000
            </option>

            <option value="$10,000–$25,000">
              $10,000–$25,000
            </option>

            <option value="$25,000–$50,000">
              $25,000–$50,000
            </option>

            <option value="$50,000+">
              $50,000+
            </option>

            <option value="Not sure">
              Not sure yet
            </option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Tell us about the project"
        htmlFor="projectDescription"
        required
      >
        <textarea
          id="projectDescription"
          name="projectDescription"
          value={formData.projectDescription}
          onChange={handleChange}
          placeholder="Describe the property, its current condition and what you would like to accomplish."
          rows="5"
          className={inputClasses}
        />
      </FormField>
    </div>
  );
}

function RoofingQuestions({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-5 border-l-4 border-gold bg-cream p-5 sm:grid-cols-2">
      <FormField
        label="Current roof type"
        htmlFor="roofType"
        required
      >
        <select
          id="roofType"
          name="roofType"
          value={formData.roofType}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="">
            Select roof type
          </option>

          <option value="Metal">
            Metal
          </option>

          <option value="Shingle">
            Shingle
          </option>

          <option value="Tile">
            Tile
          </option>

          <option value="Flat or concrete">
            Flat or concrete
          </option>

          <option value="Not sure">
            Not sure
          </option>
        </select>
      </FormField>

      <FormField
        label="Approximate roof size"
        htmlFor="roofSize"
        required
      >
        <input
          id="roofSize"
          name="roofSize"
          type="text"
          value={formData.roofSize}
          onChange={handleChange}
          placeholder="Example: 2,000 sq. ft."
          className={inputClasses}
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField
          label="Current roof condition"
          htmlFor="roofCondition"
          required
        >
          <select
            id="roofCondition"
            name="roofCondition"
            value={formData.roofCondition}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select current condition
            </option>

            <option value="Good">
              Good
            </option>

            <option value="Minor leaks or damage">
              Minor leaks or damage
            </option>

            <option value="Major leaks or damage">
              Major leaks or damage
            </option>

            <option value="Full replacement required">
              Full replacement may be required
            </option>

            <option value="Not sure">
              Not sure
            </option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function SolarQuestions({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-5 border-l-4 border-gold bg-cream p-5 sm:grid-cols-2">
      <FormField
        label="Average monthly electricity bill"
        htmlFor="electricityBill"
        required
      >
        <input
          id="electricityBill"
          name="electricityBill"
          type="text"
          value={formData.electricityBill}
          onChange={handleChange}
          placeholder="Enter an approximate amount"
          className={inputClasses}
        />
      </FormField>

      <FormField
        label="Roof type"
        htmlFor="solarRoofType"
        required
      >
        <select
          id="solarRoofType"
          name="solarRoofType"
          value={formData.solarRoofType}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="">
            Select roof type
          </option>

          <option value="Metal">
            Metal
          </option>

          <option value="Shingle">
            Shingle
          </option>

          <option value="Tile">
            Tile
          </option>

          <option value="Flat or concrete">
            Flat or concrete
          </option>

          <option value="Ground installation">
            Ground installation
          </option>

          <option value="Not sure">
            Not sure
          </option>
        </select>
      </FormField>

      <div className="sm:col-span-2">
        <FormField
          label="Do you require battery backup?"
          htmlFor="batteryBackup"
          required
        >
          <select
            id="batteryBackup"
            name="batteryBackup"
            value={formData.batteryBackup}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">
              Select one
            </option>

            <option value="Yes">
              Yes
            </option>

            <option value="No">
              No
            </option>

            <option value="Not sure">
              I would like a recommendation
            </option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function ImpactWindowQuestions({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-5 border-l-4 border-gold bg-cream p-5 sm:grid-cols-2">
      <FormField
        label="Approximate number of windows"
        htmlFor="windowQuantity"
        required
      >
        <input
          id="windowQuantity"
          name="windowQuantity"
          type="number"
          min="1"
          value={formData.windowQuantity}
          onChange={handleChange}
          placeholder="Example: 8"
          className={inputClasses}
        />
      </FormField>

      <FormField
        label="Project type"
        htmlFor="constructionType"
        required
      >
        <select
          id="constructionType"
          name="constructionType"
          value={formData.constructionType}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="">
            Select project type
          </option>

          <option value="Replacement">
            Replacement windows
          </option>

          <option value="New construction">
            New construction
          </option>

          <option value="Combination">
            Combination
          </option>
        </select>
      </FormField>

      <div className="sm:col-span-2">
        <FormField
          label="Approximate dimensions, if known"
          htmlFor="windowDimensions"
        >
          <input
            id="windowDimensions"
            name="windowDimensions"
            type="text"
            value={formData.windowDimensions}
            onChange={handleChange}
            placeholder="Example: six 36 × 60-inch windows"
            className={inputClasses}
          />
        </FormField>
      </div>
    </div>
  );
}

function ContactDetailsStep({
  formData,
  handleChange
}) {
  return (
    <div className="grid gap-6">
      <div className="border-l-4 border-gold bg-cream px-5 py-4 text-sm leading-6 text-warmGray">
        <strong className="text-charcoal">
          Notice at collection:
        </strong>{" "}
        We collect the information below to respond to your inquiry,
        assess project fit and arrange requested services. Review our{" "}
        <Link
          to="/privacy"
          className="font-semibold text-forest underline"
        >
          Privacy Policy
        </Link>{" "}
        for further information.
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Full name"
          htmlFor="fullName"
          required
        >
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Email address"
          htmlFor="email"
          required
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Telephone number"
          htmlFor="phone"
          required
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Property ZIP code"
          htmlFor="zipCode"
          required
        >
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={formData.zipCode}
            onChange={handleChange}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Credit score (approximate)"
          htmlFor="creditScore"
          required={true}
        >
          <input
            id="creditScore"
            name="creditScore"
            type="text"
            value={formData.creditScore}
            onChange={handleChange}
            placeholder="Example: 720"
            className={inputClasses}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            label="Preferred contact method"
            htmlFor="preferredContact"
            required
          >
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">
                Select one
              </option>

              <option value="Telephone">
                Telephone call
              </option>

              <option value="Email">
                Email
              </option>

              <option value="Text message">
                Text message
              </option>
            </select>
          </FormField>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-warmGray">
        <input
          type="checkbox"
          name="privacyConsent"
          checked={formData.privacyConsent}
          onChange={handleChange}
          className="mt-1 h-4 w-4 shrink-0 accent-forest"
        />

        <span>
          I agree that S/H Home Solutions may use this information
          to evaluate and respond to my service request. I have read
          the{" "}
          <Link
            to="/privacy"
            className="font-semibold text-forest underline"
          >
            Privacy Policy
          </Link>
          . This is not consent to unrelated marketing.
        </span>
      </label>
    </div>
  );
}

function QualificationSuccess() {
  return (
    <div
      className="border border-sage bg-[#EDF2ED] p-6 sm:p-9"
      role="status"
    >
      <CheckCircle2
        size={42}
        className="text-forest"
      />

      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
        Qualification completed
      </p>

      <h2 className="mt-3 font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
        Your project information is ready for review.
      </h2>

      <p className="mt-6 max-w-2xl leading-7 text-warmGray">
        Thank you for providing your project details. A team member
        can review the information and contact you regarding
        qualification and the appropriate next step.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryButton
          to="/booking"
          variant="dark"
        >
          Continue to booking
        </PrimaryButton>

        <PrimaryButton
          to="/"
          variant="gold"
          showArrow={false}
        >
          Return home
        </PrimaryButton>
      </div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  required = false,
  children
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-charcoal"
      >
        {label}

        {required && (
          <span className="text-red-700">
            {" "}*
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function getStepTitle(step) {
  if (step === 1) {
    return "Your property";
  }

  if (step === 2) {
    return "Project requirements";
  }

  return "Contact information";
}

const inputClasses = [
  "min-h-[50px]",
  "w-full",
  "border",
  "border-taupe",
  "bg-[#FBFAF7]",
  "px-4",
  "py-3",
  "text-sm",
  "text-charcoal",
  "outline-none",
  "transition",
  "placeholder:text-warmGray/60",
  "focus:border-forest",
  "focus:ring-2",
  "focus:ring-forest/10"
].join(" ");

export default QualifyPage;