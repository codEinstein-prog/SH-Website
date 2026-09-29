import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function PrimaryButton({
  to,
  children,
  variant = "dark",
  showArrow = true,
  className = ""
}) {
  const variants = {
    dark: "border-forest bg-forest text-white hover:bg-charcoal",
    gold: "border-gold bg-gold text-charcoal hover:bg-[#D5B57E]",
    light:
      "border-white/50 bg-transparent text-white hover:border-white hover:bg-white hover:text-charcoal"
  };

  return (
    <Link
      to={to}
      className={[
        "inline-flex min-h-[50px] items-center justify-center gap-2 border px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
        variants[variant],
        className
      ].join(" ")}
    >
      {children}

      {showArrow && (
        <ArrowRight size={17} />
      )}
    </Link>
  );
}

export default PrimaryButton;