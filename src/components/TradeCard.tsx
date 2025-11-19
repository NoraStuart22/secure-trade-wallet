import { Lock, Check, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TradeCardProps {
  id: string;
  buyer: string;
  seller: string;
  product: string;
  encryptedValue: string;
  encryptedTerms: string;
  encryptedSettlement: string;
  status: "pending" | "confirmed" | "settled";
  date: string;
}

export const TradeCard = ({ 
  buyer, 
  seller, 
  product, 
  encryptedValue, 
  encryptedTerms,
  encryptedSettlement,
  status,
  date 
}: TradeCardProps) => {
  const [decrypted, setDecrypted] = useState(false);

  const statusConfig = {
    pending: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: Clock },
    confirmed: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: Check },
    settled: { color: "bg-success/10 text-success", icon: Check }
  };

  const StatusIcon = statusConfig[status].icon;

  const handleDecrypt = () => {
    setDecrypted(true);
  };

  return (
    <Card className="group hover:shadow-[var(--shadow-elevated)] transition-all duration-300 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{product}</CardTitle>
          <Badge className={statusConfig[status].color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{date}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Buyer</p>
            <p className="font-medium">{buyer}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Seller</p>
            <p className="font-medium">{seller}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Trade Value</span>
            </div>
            <span className="font-mono text-sm">
              {decrypted ? "$2,450,000" : encryptedValue}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Contract Terms</span>
            </div>
            <span className="font-mono text-sm">
              {decrypted ? "Net 60 Days" : encryptedTerms}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Settlement</span>
            </div>
            <span className="font-mono text-sm">
              {decrypted ? "Wire Transfer" : encryptedSettlement}
            </span>
          </div>
        </div>

        {!decrypted && (
          <Button 
            onClick={handleDecrypt}
            className="w-full bg-gradient-to-r from-accent to-secondary hover:opacity-90 transition-opacity"
          >
            <Lock className="w-4 h-4 mr-2" />
            Decrypt with Wallet
          </Button>
        )}

        {decrypted && status === "pending" && (
          <Button 
            className="w-full bg-success hover:bg-success/90"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Trade
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
