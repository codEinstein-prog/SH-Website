function ContentSection({
  children,
  className = "",
  containerClassName = ""
}) {
  return (
    <section
      className={[
        "bg-cream py-20 md:py-28",
        className
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto max-w-site px-5 sm:px-8",
          containerClassName
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

export default ContentSection;