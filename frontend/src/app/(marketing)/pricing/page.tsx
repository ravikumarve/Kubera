import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$79",
    description: "For small teams and startups.",
    features: [
      "50 contracts/month",
      "Basic analytics dashboard",
      "Email support (48h response)",
      "Stripe Connect integration",
      "Multi-currency support",
      "Standard security",
    ],
    notIncluded: [],
  },
  {
    name: "Business",
    price: "$149",
    description: "For growing businesses.",
    popular: true,
    features: [
      "500 contracts/month",
      "Advanced analytics & reports",
      "Priority support (4h response)",
      "Custom branding",
      "Full API access",
      "Multi-user accounts",
      "Custom contract templates",
      "Dispute mediation",
    ],
    notIncluded: [],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For high-volume platforms.",
    features: [
      "Unlimited contracts",
      "Real-time analytics",
      "Dedicated support",
      "Custom SLA",
      "On-premise deployment",
      "SSO/SAML",
      "Custom integrations",
      "Dedicated account manager",
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-xl">
            KUBERA
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-4xl font-bold">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  )}
                </p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm flex items-start gap-2"
                    >
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
