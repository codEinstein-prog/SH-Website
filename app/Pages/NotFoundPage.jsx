import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="flex min-h-[65vh] items-center bg-cream px-5 py-24 sm:px-8">
      <div className="mx-auto w-full max-w-site text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gold">
          Error 404
        </p>

        <h1 className="mt-5 font-heading text-6xl font-semibold text-charcoal sm:text-7xl">
          Page not found.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-warmGray">
          The page you requested may have been moved, renamed or removed.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex min-h-[50px] items-center justify-center bg-forest px-7 text-sm font-semibold text-white"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;