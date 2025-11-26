import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lock, Upload } from "lucide-react";
import { useAccount } from "wagmi";

interface CreateTradeDialogProps {
  onCreateTrade: (trade: any) => void;
  children?: React.ReactNode;
}

export const CreateTradeDialog = ({ onCreateTrade, children }: CreateTradeDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [formData, setFormData] = useState({
    buyer: "",
    seller: "",
    product: "",
    tradeValue: "",
    contractTerms: "",
    settlementMethod: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Rainbow Wallet to create a trade contract.",
        variant: "destructive"
      });
      return;
    }

    // Generate encrypted values (mock encryption with hash-like strings)
    const encryptedValue = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const encryptedTerms = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const encryptedSettlement = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;

    const newTrade = {
      id: Date.now().toString(),
      buyer: formData.buyer,
      seller: formData.seller,
      product: formData.product,
      encryptedValue,
      encryptedTerms,
      encryptedSettlement,
      status: "pending" as const,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    onCreateTrade(newTrade);
    
    toast({
      title: "Trade Contract Created",
      description: "Your trade contract has been encrypted and uploaded successfully.",
    });

    // Reset form
    setFormData({
      buyer: "",
      seller: "",
      product: "",
      tradeValue: "",
      contractTerms: "",
      settlementMethod: ""
    });
    
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Upload className="w-4 h-4 mr-2" />
            Upload Trade Contract
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Create Encrypted Trade Contract
          </DialogTitle>
          <DialogDescription>
            Enter trade details below. All sensitive fields will be encrypted using your wallet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyer">Buyer Company</Label>
              <Input
                id="buyer"
                name="buyer"
                placeholder="e.g., TechCorp Industries"
                value={formData.buyer}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seller">Seller Company</Label>
              <Input
                id="seller"
                name="seller"
                placeholder="e.g., Global Supplies Ltd"
                value={formData.seller}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product / Service Description</Label>
            <Input
              id="product"
              name="product"
              placeholder="e.g., Industrial Electronics"
              value={formData.product}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="tradeValue">Trade Value</Label>
              <Lock className="w-3 h-3 text-accent" />
              <span className="text-xs text-muted-foreground">(will be encrypted)</span>
            </div>
            <Input
              id="tradeValue"
              name="tradeValue"
              type="text"
              placeholder="e.g., $2,450,000"
              value={formData.tradeValue}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="contractTerms">Contract Terms</Label>
              <Lock className="w-3 h-3 text-accent" />
              <span className="text-xs text-muted-foreground">(will be encrypted)</span>
            </div>
            <Textarea
              id="contractTerms"
              name="contractTerms"
              placeholder="e.g., Net 60 Days, FOB Shipping, Quality Inspection Required"
              value={formData.contractTerms}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="settlementMethod">Settlement Method</Label>
              <Lock className="w-3 h-3 text-accent" />
              <span className="text-xs text-muted-foreground">(will be encrypted)</span>
            </div>
            <Input
              id="settlementMethod"
              name="settlementMethod"
              placeholder="e.g., Wire Transfer, SWIFT, Crypto"
              value={formData.settlementMethod}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-accent to-secondary hover:opacity-90"
              disabled={!isConnected}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isConnected ? "Encrypt & Upload" : "Connect Wallet First"}
            </Button>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to encrypt and create trade contracts
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
