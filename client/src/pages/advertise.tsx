import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createAdSchema, type CreateAd } from "@shared/schema";

export default function AdvertisePage() {
  const { toast } = useToast();
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // Check for payment success and activate ad
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    
    if (urlParams.get('success') === 'true' && paymentIntentId) {
      // Activate the ad
      apiRequest("POST", "/api/activate-ad", { paymentIntentId })
        .then(() => {
          toast({
            title: "Payment Successful!",
            description: "Your ad is now active and will appear in the feed. You'll receive an email receipt from Stripe.",
          });
        })
        .catch(() => {
          toast({
            title: "Payment Received",
            description: "Payment successful! Your ad will be activated shortly.",
          });
        });
      
      // Clean up URL
      window.history.replaceState({}, '', '/advertise');
    }
  }, [toast]);

  const form = useForm<CreateAd>({
    resolver: zodResolver(createAdSchema),
    defaultValues: {
      title: "",
      body: "",
      link: "",
      impressions: 1000,
      email: "",
    },
  });

  const impressions = form.watch("impressions");

  // Calculate price when impressions change
  React.useEffect(() => {
    if (impressions) {
      const price = (impressions / 1000) * 2;
      setCalculatedPrice(price);
    }
  }, [impressions]);

  const createAdMutation = useMutation({
    mutationFn: async (data: CreateAd) => {
      const response = await apiRequest("POST", "/api/create-ad-payment", data);
      return response.json();
    },
    onSuccess: async (data) => {
      if (!data.clientSecret) {
        toast({
          title: "Payment System Error",
          description: "Unable to create payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Import Stripe dynamically
      const { loadStripe } = await import('@stripe/stripe-js');
      
      // Try multiple ways to get the publishable key
      const publicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
                       "pk_live_51RfWPeP0VGlWmmEyMfrCtw6iAwPV1MxxHD0bvd6CeSYSDYWlvMzyQAetgawX4g3guxgMiQRBmL1oFhYqxeLxayut00A6nfRavo";
                       
      console.log("Stripe publishable key available:", !!publicKey);
      
      if (!publicKey) {
        toast({
          title: "Configuration Error", 
          description: "Stripe public key not configured.",
          variant: "destructive",
        });
        return;
      }

      const stripe = await loadStripe(publicKey);
      
      if (!stripe) {
        toast({
          title: "Payment System Error",
          description: "Unable to load payment system.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe checkout
      const { error } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/advertise?success=true&payment_intent=${data.paymentIntentId}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create ad";
      
      if (error.message && error.message.includes("STRIPE_SECRET_KEY")) {
        errorMessage = "Stripe is not configured. Please contact the site administrator.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAd) => {
    createAdMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          <main className="lg:col-span-3">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Advertise on Sosiol</CardTitle>
                <p className="text-muted-foreground">
                  Reach our engaged community with text-based advertisements. 
                  Simple, effective, and affordable at $2 per 1000 impressions.
                </p>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <AlertDescription>
                    <strong>Content Policy:</strong> While Sosiol supports free speech, we reserve the right to remove ads that are strongly violent or hostile. All posts remain unmoderated.
                  </AlertDescription>
                </Alert>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Write a compelling title..."
                              maxLength={200}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 200 characters. This will be displayed prominently.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Body (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add more details about your ad..."
                              rows={4}
                              maxLength={1000}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum 1000 characters. Additional description text.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="example.com or https://example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Where users will go when they click your ad. Protocol (https://) will be added automatically if needed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impressions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impressions *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1000}
                              max={100000}
                              step={1000}
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                field.onChange(value);
                                setCalculatedPrice((value / 1000) * 2);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 1,000 impressions. Your ad stops showing once this limit is reached.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Receive payment receipt and ad notifications via email.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total Cost:</span>
                          <span className="text-primary">
                            ${calculatedPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Your ad will appear in the feed every 10 posts until all impressions are used.
                        </p>
                      </CardContent>
                    </Card>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={createAdMutation.isPending}
                    >
                      {createAdMutation.isPending ? "Processing..." : `Pay $${calculatedPrice.toFixed(2)} & Publish Ad`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}