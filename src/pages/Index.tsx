import { Header } from "@/components/Header";
import { TradeCard } from "@/components/TradeCard";
import { Shield, Lock, CheckCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTrades = [
  {
    id: "1",
    buyer: "TechCorp Industries",
    seller: "Global Supplies Ltd",
    product: "Industrial Electronics",
    encryptedValue: "0x7f9a...c3d2",
    encryptedTerms: "0x4b2e...8f1a",
    encryptedSettlement: "0x9c3d...2a7b",
    status: "pending" as const,
    date: "Dec 15, 2024"
  },
  {
    id: "2",
    buyer: "Manufacturing Co",
    seller: "Raw Materials Inc",
    product: "Steel Alloy Components",
    encryptedValue: "0x2d8f...9e4c",
    encryptedTerms: "0x6a1b...5d3f",
    encryptedSettlement: "0x8e2c...1f6a",
    status: "confirmed" as const,
    date: "Dec 14, 2024"
  },
  {
    id: "3",
    buyer: "Pharma Solutions",
    seller: "BioTech Exports",
    product: "Medical Equipment",
    encryptedValue: "0x5c7a...3b9d",
    encryptedTerms: "0x9f4e...7c2a",
    encryptedSettlement: "0x1a6d...4e8b",
    status: "settled" as const,
    date: "Dec 10, 2024"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent -z-10" />
        
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Trade Globally, Secure Every Number
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Field-level encryption for trade settlements. Only approved partners can decrypt protected values after mutual confirmation.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Upload Trade Contract
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Field-Level Encryption</h3>
              <p className="text-sm text-muted-foreground">
                Each trade value, term, and settlement figure is individually encrypted for maximum security.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mutual Confirmation</h3>
              <p className="text-sm text-muted-foreground">
                Both parties must confirm before encrypted details are revealed to approved partners.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Trade Support</h3>
              <p className="text-sm text-muted-foreground">
                Connect with verified trade partners worldwide with blockchain-verified credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trades Section */}
      <section id="trades" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold">Active Trade Contracts</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTrades.map(trade => (
              <TradeCard key={trade.id} {...trade} />
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="w-16 h-16 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Your trade data is protected with military-grade encryption. Rainbow Wallet integration ensures only authorized parties can decrypt sensitive information.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-success/10 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Zero-Knowledge Architecture</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
