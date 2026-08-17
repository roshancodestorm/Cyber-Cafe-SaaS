"use client";

import { PRICING_PLANS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PricingSection() {
  return (
    <section className="py-24 border-b bg-background" id="pricing">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Transparent Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Choose the perfect plan for your cyber cafe. No hidden fees.
          </motion.p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="flex"
            >
              <Card className={`w-full flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${plan.isPopular ? 'border-primary shadow-xl shadow-primary/10' : 'border-muted hover:shadow-lg'}`}>
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3 z-10">
                    <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mr-2" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.price === "Custom" ? (
                    <Link href="mailto:sales@cybersaas.com" className="w-full">
                      <Button
                        className="w-full"
                        variant="outline"
                        size="lg"
                      >
                        Contact Sales
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/register/cafe" className="w-full">
                      <Button
                        className="w-full"
                        variant={plan.isPopular ? "default" : "outline"}
                        size="lg"
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
