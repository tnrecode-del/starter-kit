import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Zap,
  Shield,
  Cpu,
  Sparkles,
  Play,
  TrendingDown,
  Clock,
  Code2,
  Database,
  Layers,
  Box,
} from "lucide-react";

import { PipelineVisualizer } from "@/widgets/pipeline/ui/PipelineVisualizer";
import { LandingHeader } from "@/widgets/header/ui/LandingHeader";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <LandingHeader />
      {/* Background gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-20 bg-[radial-gradient(ellipse_at_top,var(--color-primary),transparent_60%)] blur-[100px] dark:opacity-30" />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32">
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex flex-col items-center gap-6 mb-10 fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 backdrop-blur-md shadow-sm transition-all hover:bg-primary/20 cursor-default">
                <Sparkles className="w-4 h-4" />
                <span>{t("heroBadge")}</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight max-w-5xl text-transparent bg-clip-text bg-linear-to-br from-foreground to-foreground/50 leading-tight">
                {t("heroTitle")}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed mt-4">
                {t("heroDesc")}
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row items-center gap-6 fade-in mb-24"
              style={{ animationDelay: "150ms" }}
            >
              <Link
                href="/admin"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-1 hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("heroPrimaryCta")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-muted/50 backdrop-blur-md px-8 text-base font-semibold text-foreground shadow-sm border border-border transition-all hover:bg-muted/80 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Play className="h-5 w-5 ml-1" />
                {t("heroSecondaryCta")}
              </a>
            </div>

            {/* Interactive Pipeline Visualizer */}
            <div
              className="w-full max-w-6xl mx-auto fade-in shadow-2xl shadow-primary/5 rounded-2xl overflow-hidden border border-border/50 bg-background/50 backdrop-blur-xl"
              style={{ animationDelay: "300ms" }}
            >
              <PipelineVisualizer />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-24 bg-background border-b border-t border-border/50 relative"
        >
          <div className="absolute inset-0 bg-linear-to-b from-muted/20 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                {t("howItWorksTitle")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("howItWorksDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-linear-to-r from-border via-primary/50 to-border" />

              <div className="flex flex-col gap-6 relative z-10 items-center text-center">
                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-xl shadow-primary/20 border border-primary/20">
                  1
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">{t("step1Title")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {t("step1Desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 relative z-10 items-center text-center">
                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-xl shadow-primary/20 border border-primary/20">
                  2
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">{t("step2Title")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {t("step2Desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 relative z-10 items-center text-center">
                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-xl shadow-primary/20 border border-primary/20">
                  3
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-2xl">{t("step3Title")}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {t("step3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI and Metrics Section */}
        <section className="py-24 bg-muted/10 border-b border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {t("roiTitle")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("roiDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center justify-center p-8 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div className="text-4xl font-extrabold text-foreground mb-2">
                  90%
                </div>
                <h3 className="font-medium text-muted-foreground text-center">
                  {t("roiStat1Title1")}
                  <br />
                  {t("roiStat1Title2")}
                </h3>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Terminal className="h-6 w-6" />
                </div>
                <div className="text-4xl font-extrabold text-foreground mb-2">
                  &lt;$0.05
                </div>
                <h3 className="font-medium text-muted-foreground text-center">
                  {t("roiStat2Title1")}
                  <br />
                  {t("roiStat2Title2")}
                </h3>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-4xl font-extrabold text-foreground mb-2">
                  ~3-5m
                </div>
                <h3 className="font-medium text-muted-foreground text-center">
                  {t("roiStat3Title1")}
                  <br />
                  {t("roiStat3Title2")}
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t("featuresTitle")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("featuresDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-background/40 backdrop-blur-2xl border border-border/50 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 group">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl">{t("feature1Title")}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t("feature1Desc")}
                </p>
              </div>

              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-background/40 backdrop-blur-2xl border border-border/50 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 group">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Cpu className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl">{t("feature2Title")}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t("feature2Desc")}
                </p>
              </div>

              <div className="flex flex-col gap-4 p-8 rounded-3xl bg-background/40 backdrop-blur-2xl border border-border/50 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-300 group">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-xl">{t("feature3Title")}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t("feature3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Tech Stack Section */}
        <section className="py-24 bg-muted/5 border-t border-b border-border/50">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-12 text-foreground/80">
              {t("techStackTitle")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border/50 justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
                <Layers className="h-5 w-5" />
                <span className="font-semibold">Next.js App Router</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border/50 justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
                <Box className="h-5 w-5" />
                <span className="font-semibold">Tailwind CSS v4</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border/50 justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
                <Database className="h-5 w-5" />
                <span className="font-semibold">PostgreSQL</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border/50 justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
                <Code2 className="h-5 w-5" />
                <span className="font-semibold">TypeScript & tRPC</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-32 relative overflow-hidden bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary),transparent_70%)] opacity-5" />
          <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t("ctaTitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t("ctaDesc")}
            </p>
            <Link
              href="/admin"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("ctaButton")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-primary font-bold tracking-tight text-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Terminal className="h-5 w-5" />
            </div>
            <span>AI Orchestrator</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Discord
            </Link>
          </div>
          <p className="text-sm text-muted-foreground/80">
            &copy; {new Date().getFullYear()} {t("footerRights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
