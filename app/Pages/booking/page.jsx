import { useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  ShieldCheck
} from "lucide-react";

import { Link } from "react-router-dom";

import ContentSection from "/components/ContentSection";
import PageHero from "/components/PageHero";
import PrimaryButton from "/components/PrimaryButton";
import { siteConfig } from "/app/config/site";

const initialBookingData = {
  appointmentType: "",
  service: "",
  fullName: "",
  email: "",
  phone: "",
  propertyAddress: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
  privacyConsent: false
};

function BookingPage() {
  const [formData, setFormData] = useState(initialBookingData);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value
    }));

    setFormError("");
  }

  function validateForm() {
    const requiredFields = [
      "appointmentType",
      "service",
      "fullName",
      "email",
      "phone",
      "preferredDate",
      "preferredTime"
    ];

    const missingField = requiredFields.some(
      (field) => !formData[field]
    );

    if (missingField) {
      setFormError(
        "Please complete all required appointment and contact information."
      );

      return false;
    }

    if (!formData.privacyConsent) {
      setFormError(
        "You must acknowledge the Privacy Policy before submitting."
      );

      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      /*
       * Connect your booking form to an API here.
       *
       * Example:
       *
       * const response = await fetch(
       *   "https://your-api.example.com/bookings",
       *   {
       *     method: "POST",
       *     headers: {
       *       "Content-Type": "application/json"
       *     },
       *     body: JSON.stringify(formData)
       *   }
       * );
       *
       * if (!response.ok) {
       *   throw new Error("Booking request failed.");
       * }
       */

      console.log("Booking request:", formData);

      setSubmitted(true);
    } catch (error) {
      console.error(error);

      setFormError(
        "Your appointment request could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Consultations and site visits"
        title="Choose the right next step."
        description="Request focused time with the team. Qualified projects can move from an initial consultation to an on-property assessment."
        image="/images/project-windows.png"
        imageAlt="Modern home with black-framed impact windows"
      />

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <BookingIntroduction />

          <div className="border border-taupe bg-white p-5 sm:p-8 lg:p-11">
            {submitted ? (
              <BookingSuccess
                formData={formData}
                resetForm={() => {
                  setFormData(initialBookingData);
                  setSubmitted(false);
                }}
              />
            ) : (
              <BookingForm
                formData={formData}
                today={today}
                formError={formError}
                submitting={submitting}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </ContentSection>

      {siteConfig.bookingUrl && (
        <CalendlySection />
      )}
    </>
  );
}

function BookingIntroduction() {
  return (
    <aside>
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-gold">
        Book a time
      </p>

      <h2 className="font-heading text-5xl font-semibold leading-[0.95] text-charcoal sm:text-6xl">
        Focused time for your property.
      </h2>

      <p className="mt-7 leading-7 text-warmGray">
        Choose an initial consultation for questions and planning, or
        request a site visit when measurements and property
        conditions need to be reviewed.
      </p>

      <div className="mt-9 space-y-5">
        <BookingInformationItem
          icon={CalendarDays}
          title="Consultations and site visits"
          description="Choose the appointment type that matches your current project stage."
        />

        <BookingInformationItem
          icon={Clock3}
          title="Availability confirmation"
          description="Requested dates and times are confirmed after the team's calendar is reviewed."
        />

        <BookingInformationItem
          icon={MapPin}
          title="Service-area verification"
          description="The property location is confirmed before an on-site appointment is finalized."
        />

        <BookingInformationItem
          icon={ShieldCheck}
          title="Privacy considered"
          description="Contact and property information is used only to manage your inquiry and requested service."
        />
      </div>

      <div className="mt-10 border-l-4 border-gold bg-white p-5">
        <p className="text-sm font-semibold text-charcoal">
          Not sure whether you qualify?
        </p>

        <p className="mt-2 text-sm leading-6 text-warmGray">
          Complete the short qualification questionnaire before
          requesting a site visit.
        </p>

        <Link
          to="/qualify"
          className="mt-4 inline-flex text-sm font-semibold text-forest underline"
        >
          Check project qualification
        </Link>
      </div>
    </aside>
  );
}

function BookingInformationItem({
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

function BookingForm({
  formData,
  today,
  formError,
  submitting,
  handleChange,
  handleSubmit
}) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gold">
          Appointment request
        </p>

        <h2 className="mt-3 font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
          Tell us when you’re available.
        </h2>
      </div>

      <div className="mb-7 border-l-4 border-gold bg-cream px-5 py-4 text-sm leading-6 text-warmGray">
        <strong className="text-charcoal">
          Notice at collection:
        </strong>{" "}
        Contact and property information is used to respond to this
        request and arrange service. Read the{" "}
        <Link
          to="/privacy"
          className="font-semibold text-forest underline"
        >
          Privacy Policy
        </Link>{" "}
        for further information.
      </div>

      <div className="grid gap-6">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-charcoal">
            Appointment type *
          </legend>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Initial consultation",
              "Site visit",
              "Project follow-up"
            ].map((appointmentType) => (
              <label
                key={appointmentType}
                className={[
                  "flex min-h-[70px] cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition",
                  formData.appointmentType === appointmentType
                    ? "border-forest bg-sage/30"
                    : "border-taupe bg-[#FBFAF7] hover:border-dustySage"
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="appointmentType"
                  value={appointmentType}
                  checked={
                    formData.appointmentType === appointmentType
                  }
                  onChange={handleChange}
                  className="accent-forest"
                />

                <span>
                  {appointmentType}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Service"
            htmlFor="bookingService"
            required
          >
            <select
              id="bookingService"
              name="service"
              value={formData.service}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">
                Select a service
              </option>

              <option value="Roofing">
                Roofing
              </option>

              <option value="Solar">
                Solar
              </option>

              <option value="Impact windows">
                Impact windows
              </option>

              <option value="Multiple services">
                Multiple services
              </option>
            </select>
          </FormField>

          <FormField
            label="Full name"
            htmlFor="bookingFullName"
            required
          >
            <input
              id="bookingFullName"
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
            htmlFor="bookingEmail"
            required
          >
            <input
              id="bookingEmail"
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
            htmlFor="bookingPhone"
            required
          >
            <input
              id="bookingPhone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField
            label="Preferred date"
            htmlFor="preferredDate"
            required
          >
            <input
              id="preferredDate"
              name="preferredDate"
              type="date"
              min={today}
              value={formData.preferredDate}
              onChange={handleChange}
              className={inputClasses}
            />
          </FormField>

          <FormField
            label="Preferred time"
            htmlFor="preferredTime"
            required
          >
            <select
              id="preferredTime"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">
                Select a time
              </option>

              <option value="Morning">
                Morning
              </option>

              <option value="Afternoon">
                Afternoon
              </option>

              <option value="Flexible">
                Flexible
              </option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField
              label="Property address"
              htmlFor="propertyAddress"
            >
              <input
                id="propertyAddress"
                name="propertyAddress"
                type="text"
                autoComplete="street-address"
                value={formData.propertyAddress}
                onChange={handleChange}
                placeholder="Required before a site visit is confirmed"
                className={inputClasses}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField
              label="Additional information"
              htmlFor="bookingNotes"
            >
              <textarea
                id="bookingNotes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Tell us what you would like to discuss or what the team should know before contacting you."
                rows="5"
                className={inputClasses}
              />
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
            to respond to my appointment request. I acknowledge the{" "}
            <Link
              to="/privacy"
              className="font-semibold text-forest underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      </div>

      {formError && (
        <div
          role="alert"
          className="mt-6 border-l-4 border-red-600 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          {formError}
        </div>
      )}

      <div className="mt-8 flex justify-end border-t border-taupe pt-7">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[50px] min-w-[190px] items-center justify-center bg-forest px-7 text-sm font-semibold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Submitting..."
            : "Request appointment"}
        </button>
      </div>
    </form>
  );
}

function BookingSuccess({
  formData,
  resetForm
}) {
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
        Request received
      </p>

      <h2 className="mt-3 font-heading text-4xl font-semibold text-charcoal sm:text-5xl">
        Your appointment request has been prepared.
      </h2>

      <p className="mt-6 leading-7 text-warmGray">
        Thank you, {formData.fullName}. Your requested date is{" "}
        <strong className="text-charcoal">
          {formData.preferredDate}
        </strong>{" "}
        during the{" "}
        <strong className="text-charcoal">
          {formData.preferredTime.toLowerCase()}
        </strong>
        .
      </p>

      <p className="mt-4 leading-7 text-warmGray">
        The appointment remains pending until the team reviews
        availability and sends confirmation.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryButton
          to="/"
          variant="dark"
        >
          Return home
        </PrimaryButton>

        <button
          type="button"
          onClick={resetForm}
          className="inline-flex min-h-[50px] items-center justify-center border border-gold bg-gold px-6 text-sm font-semibold text-charcoal"
        >
          Submit another request
        </button>
      </div>
    </div>
  );
}

function CalendlySection() {
  return (
    <section className="bg-forest py-20 text-white">
      <div className="mx-auto grid max-w-site gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#E7C995]">
            Live scheduling
          </p>

          <h2 className="mt-4 font-heading text-5xl font-semibold">
            View available appointment times.
          </h2>

          <p className="mt-5 max-w-2xl leading-7 text-white/65">
            Use the secure scheduling page to select an available
            appointment directly from the company calendar.
          </p>
        </div>

        <a
          href={siteConfig.bookingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-gold px-7 text-sm font-semibold text-charcoal"
        >
          Open scheduling calendar
          <ExternalLink size={17} />
        </a>
      </div>
    </section>
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

export default BookingPage;