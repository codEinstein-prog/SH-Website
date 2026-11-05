function PageHero({
  eyebrow,
  title,
  description,
  image = "/images/hero-home.png",
  imageAlt = "Contemporary home improvement project"
}) {
  return (
    <section className="relative min-h-[400px] overflow-hidden text-white md:min-h-[460px]">
      <img
        src={image}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#142018]/90 via-[#142018]/60 to-[#142018]/15" />

      <div className="relative mx-auto flex min-h-[400px] max-w-site flex-col justify-center px-5 py-20 sm:px-8 md:min-h-[460px]">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#E7C995]">
          {eyebrow}
        </p>

        <h1 className="max-w-4xl font-heading text-6xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
          {title}
        </h1>

        {description && (
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

export default PageHero;