import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { ProductShowcase } from "@/components/product-showcase";
import { Features } from "@/components/features";
import { TechStack } from "@/components/tech-stack";
import { VideoPlayer } from "@/components/video-player";
import { Testimonials } from "@/components/testimonials";
import { ProductIntro } from "@/components/product-intro";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Navbar />
      <Hero />

      <Stats />

      <section
        className="px-6 py-16 bg-linear-to-b from-transparent via-blue-500/5 to-transparent"
        id="action"
      >
        <div className="mx-auto max-w-7xl text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See Clario in Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Watch how teams collaborate in real-time
          </p>
        </div>
        <VideoPlayer
          src="https://xtmtujq4hznlol4k.public.blob.vercel-storage.com/clario-demo.mp4"
          poster="thumbnail-clario-demo.png"
          title="Clario Demo - Real-time Collaboration"
        />
      </section>

      <Testimonials />
      <ProductIntro />
      <ProductShowcase />
      <Features />
      <TechStack />
      <Footer />
    </main>
  );
}
