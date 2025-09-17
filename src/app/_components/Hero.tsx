export default function Hero() {
  return (
    <section
      className="bg-black lg:grid lg:h-screen
    lg:place-content-center pt-70"
    >
      <div
        className="flex items-baseline
        justify-center"
      >
        <h2
          className="text-white border
            px-3 p-2 rounded-full
        text-center border-white"
        >
          See What's New | <span className="text-indigo-400">AI Diagram</span>
        </h2>
      </div>
      <div className="mx-auto h-screen max-w-screen-xl px-4 py-12 lg:flex">
        <div className="mx-auto max-w-prose text-center">
          <h1 className="text-6xl font-bold text-gray-400 sm:text-5xl">
            Documents & diagrams
            <strong className="text-indigo-400"> for engineering </strong>
            teams.
          </h1>

          <p className="mt-4 text-base text-pretty text-slate-200 sm:text-lg/relaxed">
            All-in-one markdown editor, collaborative canvas, and
            diagram-as-code builder
          </p>

          <div className="mt-4 flex justify-center gap-4 sm:mt-6">
            <a
              className="inline-block rounded border border-indigo-600 bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              href="#"
            >
              Learn more!
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
