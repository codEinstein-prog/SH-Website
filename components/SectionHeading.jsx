function SectionHeading({
  eyebrow,
  title,
  description,
  light = false
}) {
  return (
    <div className="mb-14 grid items-end gap-8 lg:grid-cols-[1.5fr_0.65fr] lg:gap-20">
      <div>
        <p
          className={[
            "mb-5 text-xs font-semibold uppercase tracking-[0.17em]",
            light ? "text-[#E7C995]" : "text-gold"
          ].join(" ")}
        >
          {eyebrow}
        </p>

        <h2
          className={[
            "font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl",
            light ? "text-white" : "text-charcoal"
          ].join(" ")}
        >
          {title}
        </h2>
      </div>

      {description && (
        <p
          className={[
            "mb-1 leading-7",
            light ? "text-white/65" : "text-warmGray"
          ].join(" ")}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;