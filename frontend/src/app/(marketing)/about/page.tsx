import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            KUBERA
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-24 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">About KUBERA</h1>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Our Mission
            </h2>
            <p>
              KUBERA provides enterprise-grade escrow infrastructure for B2B
              transactions. We make it easy for platforms to offer secure,
              milestone-based payment protection without building escrow
              technology from scratch.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Why KUBERA?
            </h2>
            <p>
              Every year, billions of dollars in B2B transactions are at risk
              due to trust issues between buyers and sellers. Traditional escrow
              services are slow, expensive, and difficult to integrate. KUBERA
              solves this with a modern API-first platform that handles
              payment protection, milestone management, and dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              The Team
            </h2>
            <p>
              We are a small, focused team of engineers and product builders
              passionate about B2B fintech. Our backgrounds span payments,
              marketplace platforms, and distributed systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Get in Touch
            </h2>
            <p>
              Have questions or want to learn more? We would love to hear from
              you. Reach out to us at{" "}
              <a
                href="mailto:hello@kubera.dev"
                className="text-primary underline"
              >
                hello@kubera.dev
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
