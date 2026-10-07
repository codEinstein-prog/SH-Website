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
    title: "1. Share Your Link",
    description: "Send your unique invite link to friends, family, or coworkers.",
  },
  {
    id: "step2",
    icon: "🔑",
    title: "2. They Sign Up",
    description: "Your friends create a free account using your custom code.",
  },
  {
    id: "step3",
    icon: "💰",
    title: "3. Earn Rewards",
    description: "You both get \$10 in credits added directly to your wallets!",
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
          <strong>Invite & Earn Rewards</strong>
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
              Give your friends <strong>\$10</strong>, get <strong>\$10</strong> when they complete their first registration!
            </div>

            {/* Information Rows */}
            <div className="referral-steps-container">
              {REFERRAL_STEPS.map((step) => (
                <InfoRow key={step.id} step={step} />
              ))}
            </div>
          </div>

          {/* Interactive Handoff Section (Action Bar) */}
          <div className="referral-handoff">
            <div className="referral-code-display">
              <span className="referral-code-label">Your Code:</span>
              <span className="referral-code-value">{REFERRAL_CODE}</span>
            </div>

            <button
              type="button"
              className={`referral-handoff-button ${copied ? "copied" : ""}`}
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy Invite Link
                </>
              )}
            </button>
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
