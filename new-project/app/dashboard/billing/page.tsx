"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Check,
  Zap,
  ArrowRight
} from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: 10,
    features: ["Basic 3D models", "GLB export only", "Community support"],
    current: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    credits: 200,
    features: ["High-quality models", "All export formats", "PBR materials", "Priority support", "API access"],
    current: true,
  },
  {
    name: "Studio",
    price: "$99",
    period: "per month",
    credits: "Unlimited",
    features: ["Maximum quality", "Custom LOD settings", "Team collaboration", "Dedicated support", "Custom integrations"],
    current: false,
  },
]

const invoices = [
  { id: "INV-2026-003", date: "Feb 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-2026-002", date: "Jan 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-2026-001", date: "Dec 1, 2025", amount: "$29.00", status: "Paid" },
]

export default function BillingPage() {
  const currentPlan = plans.find((p) => p.current)
  const usedCredits = 58
  const totalCredits = 200

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods</p>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You are currently on the {currentPlan?.name} plan</CardDescription>
              </div>
              <Badge className="text-lg px-4 py-1">{currentPlan?.name}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credits Usage */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Monthly Credits</span>
                <span className="text-muted-foreground">{usedCredits} / {totalCredits} used</span>
              </div>
              <Progress value={(usedCredits / totalCredits) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Resets on March 1, 2026
              </p>
            </div>

            {/* Plan Details */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">{currentPlan?.price}<span className="text-sm font-normal text-muted-foreground">/{currentPlan?.period}</span></p>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Next Billing</p>
                <p className="text-2xl font-bold">Mar 1</p>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">•••• 4242</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">Update Payment Method</Button>
              <Button variant="outline" className="text-destructive hover:text-destructive">Cancel Subscription</Button>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Upgrade or downgrade your plan anytime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    plan.current
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {plan.current && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {typeof plan.credits === "number" ? `${plan.credits} credits/month` : plan.credits + " credits"}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" variant={plan.name === "Studio" ? "default" : "outline"}>
                      {plan.name === "Free" ? "Downgrade" : "Upgrade"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Need More Credits */}
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Need more credits?</h4>
                  <p className="text-sm text-muted-foreground">Purchase additional credits without changing your plan</p>
                </div>
              </div>
              <Button>
                Buy Credits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>Download your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-mono text-muted-foreground">{invoice.id}</div>
                    <div className="text-sm">{invoice.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="secondary">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
