import React, { useState } from "react";
import "./referral.css";

// ============================================================
// Referral Configuration
// ============================================================
const REFERRAL_CODE = "JAM-XYZ789";
const REFERRAL_LINK = `https://yourapp.com{REFERRAL_CODE}`;

const REFERRAL_STEPS = [
  {
    id: "step1",
    icon: "✉️",
    title: "1. TELL YOUR FRIENDS",
    description: "Let your friends and coworkers know about our services and invite them to visit our website.",
  },
  {
    id: "step2",
    icon: "🔑",
    title: "2. They Book & Get a Estimate",
    description: "They book a free consultation through our website and receive a personalized estimate for their project.",
  },
  {
    id: "step3",
    icon: "💰",
    title: "3. You Earn Rewards",
    description: "You benefit between $200 and $500 for each completed job form your referral. The more friends you refer, the more you earn!",
  },
];

// ============================================================
// Gift / Reward Icon
// ============================================================
function GiftIcon({ size = 28 }) {
  return (
    <svg
      xmlns="http://w3.org"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// ============================================================
// Widget Header
// ============================================================
function WidgetHeader({ onClose }) {
  return (
    <div className="referral-widget-header">
      <div className="referral-program">
        <div className="referral-program-icon">
          <GiftIcon size={23} />
        </div>

        <div className="referral-program-info">
          <strong>View our Referral Program</strong>
          <span>
            <i className="referral-active-dot" />
            Program is currently active
          </span>
        </div>
      </div>

      <button
        type="button"
        className="referral-close-button"
        onClick={onClose}
        aria-label="Close referral details"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// Info Row (Replaces Chat Messages)
// ============================================================
function InfoRow({ step }) {
  return (
    <div className="referral-info-row">
      <span className="referral-step-badge" role="img" aria-hidden="true">
        {step.icon}
      </span>
      <div className="referral-step-text">
        <strong>{step.title}</strong>
        <p>{step.description}</p>
      </div>
    </div>
  );
}

// ============================================================
// Main Referral Component
// ============================================================
function ReferralWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const openWidget = () => setIsOpen(true);
  const closeWidget = () => setIsOpen(false);

  // ----------------------------------------------------------
  // Copy Link Handler
  // ----------------------------------------------------------
  const handleCopyLink = () => {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      {/* ======================================================
          Information Window
          ====================================================== */}
      {isOpen && (
        <div
          className="referral-widget-window"
          role="dialog"
          aria-label="Referral program details"
        >
          <WidgetHeader onClose={closeWidget} />

          {/* Core Information Display Body */}
          <div className="referral-widget-body">
            <div className="referral-intro-banner">
              <strong>Sharing the benefits of our services with your network has never been more rewarding</strong>. Simply invite your friends and coworkers to visit our website and discover how we can help them. When they book a free consultation, they will receive a personalized, no obligation estimate tailored to their specific project needs. Once your referred friend's job is successfully completed, you will earn <strong>cash rewards between $200 and $500</strong> as a thank you from us. There are absolutely no caps or limits on your earning potential the more friends you refer, the more rewards you bring home!
            </div>
          </div>

          <div className="referral-terms-note">
            Terms & Conditions apply. Rewards are credited instantly.
          </div>
        </div>
      )}

      {/* ======================================================
          Floating Button
          ====================================================== */}
      <button
        type="button"
        className={`referral-floating-button ${
          isOpen ? "referral-floating-button-open" : ""
        }`}
        onClick={isOpen ? closeWidget : openWidget}
        aria-label={isOpen ? "Close referral info" : "Open referral info"}
        aria-expanded={isOpen}
      >
        <span className="referral-icon-wrapper">
          {isOpen ? (
            <span className="referral-x-icon">×</span>
          ) : (
            <GiftIcon size={26} />
          )}
        </span>

        {!isOpen && (
          <span className="referral-floating-label">
            Invite & Earn
          </span>
        )}
      </button>
    </>
  );
}

export default ReferralWidget;
