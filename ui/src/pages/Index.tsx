import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Shield, Lock, CheckCircle, DollarSign, Users, TrendingDown, Eye, Key } from "lucide-react";
import { useBidding } from "@/hooks/useBidding";
import { formatAddress } from "@/lib/utils";

// Contract address - should be set after deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

interface BidInfo {
  bidder: string;
  encryptedPrice: string;
  timestamp: bigint;
  decryptedPrice?: number;
}

const Index = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [bidPrice, setBidPrice] = useState("");
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [lowestBid, setLowestBid] = useState<{ encryptedPrice: string; exists: boolean } | null>(null);
  const [decryptedLowest, setDecryptedLowest] = useState<number | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<string | null>(null);

  const {
    contractAddress,
    isLoading,
    message,
    submitBid,
    getBid,
    findLowestBid,
    getLowestBid,
    getAllBidders,
    decryptBid,
    isOrganizer,
  } = useBidding(CONTRACT_ADDRESS);

  // Load all bids
  const loadBids = useCallback(async () => {
    if (!contractAddress) return;

    try {
      const bidders = await getAllBidders();
      const bidPromises = bidders.map(async (bidder) => {
        const bid = await getBid(bidder);
        return bid ? { ...bid, bidder } : null;
      });
      const loadedBids = (await Promise.all(bidPromises)).filter((b) => b !== null) as BidInfo[];
      setBids(loadedBids);
    } catch (error) {
      console.error("Error loading bids:", error);
    }
  }, [contractAddress, getAllBidders, getBid]);

  // Load lowest bid
  const loadLowestBid = useCallback(async () => {
    if (!contractAddress) return;

    try {
      const lowest = await getLowestBid();
      setLowestBid(lowest);
      if (lowest?.exists && isOrganizer) {
        try {
          const decrypted = await decryptBid(lowest.encryptedPrice);
          setDecryptedLowest(decrypted);
        } catch (error) {
          console.error("Error decrypting lowest bid:", error);
        }
      }
    } catch (error) {
      console.error("Error loading lowest bid:", error);
    }
  }, [contractAddress, getLowestBid, isOrganizer, decryptBid]);

  useEffect(() => {
    if (contractAddress && isConnected) {
      loadBids();
      loadLowestBid();
    }
  }, [contractAddress, isConnected, loadBids, loadLowestBid]);

  const handleSubmitBid = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit a bid.",
        variant: "destructive",
      });
      return;
    }

    if (!bidPrice || isNaN(Number(bidPrice)) || Number(bidPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid bid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitBid(Number(bidPrice));
      toast({
        title: "Bid Submitted Successfully!",
        description: `Your encrypted bid of ${bidPrice} has been submitted.`,
      });
      setBidPrice("");
      await loadBids();
    } catch (error: any) {
      toast({
        title: "Error Submitting Bid",
        description: error.message || "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFindLowest = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      await findLowestBid();
      toast({
        title: "Lowest Bid Calculated",
        description: "The lowest bid has been calculated using FHE operations.",
      });
      await loadLowestBid();
    } catch (error: any) {
      toast({
        title: "Error Finding Lowest Bid",
        description: error.message || "Failed to find lowest bid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDecryptBid = async (encryptedPrice: string, bidder: string) => {
    if (!isOrganizer) {
      toast({
        title: "Unauthorized",
        description: "Only the organizer can decrypt bids.",
        variant: "destructive",
      });
      return;
    }

    setIsDecrypting(bidder);
    try {
      const decrypted = await decryptBid(encryptedPrice);
      setBids((prev) =>
        prev.map((bid) => (bid.bidder === bidder ? { ...bid, decryptedPrice: decrypted } : bid))
      );
      toast({
        title: "Bid Decrypted",
        description: `Decrypted price: ${decrypted}`,
      });
    } catch (error: any) {
      toast({
        title: "Decryption Error",
        description: error.message || "Failed to decrypt bid.",
        variant: "destructive",
      });
    } finally {
      setIsDecrypting(null);
    }
  };

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
              Encrypted Bidding System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Submit encrypted bids without revealing prices. Fair tender process with fully homomorphic encryption.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Encrypted Bids</h3>
              <p className="text-sm text-muted-foreground">
                All bid prices are encrypted using FHE, ensuring complete privacy during the tender process.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <TrendingDown className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">FHE Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Find the lowest bid without decrypting individual prices using fully homomorphic encryption.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fair Tender</h3>
              <p className="text-sm text-muted-foreground">
                Prevent competitors from seeing each other's bids, ensuring a fair and transparent process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Bid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-accent" />
                Submit Your Bid
              </CardTitle>
              <CardDescription className="text-base">
                Enter your bid price. It will be encrypted before submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bidPrice">Bid Price</Label>
                <div className="flex gap-2">
                  <Input
                    id="bidPrice"
                    type="number"
                    placeholder="Enter your bid amount (e.g., 1000)"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    className="flex-1"
                    disabled={!isConnected || isLoading}
                  />
                  <Button
                    onClick={handleSubmitBid}
                    disabled={!isConnected || isLoading || !bidPrice}
                    className="bg-gradient-to-r from-accent to-secondary hover:opacity-90"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        {message || "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Submit Bid
                      </>
                    )}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground">Please connect your wallet to submit a bid.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bids List Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              <h2 className="text-3xl font-bold">All Bids</h2>
            </div>
            <Button onClick={loadBids} variant="outline" disabled={!contractAddress}>
              Refresh
            </Button>
          </div>

          {bids.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No bids submitted yet.</p>
                <p className="text-sm text-muted-foreground">Be the first to submit a bid!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bids.map((bid) => (
                <Card key={bid.bidder} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Bidder</CardTitle>
                    <CardDescription className="font-mono text-xs">{formatAddress(bid.bidder)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Encrypted Price</p>
                      <p className="font-mono text-accent text-xs break-all">{bid.encryptedPrice}</p>
                    </div>
                    {bid.decryptedPrice !== undefined ? (
                      <div className="p-3 bg-success/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Decrypted Price</p>
                        <p className="text-2xl font-bold text-success">{bid.decryptedPrice}</p>
                      </div>
                    ) : (
                      isOrganizer && (
                        <Button
                          onClick={() => handleDecryptBid(bid.encryptedPrice, bid.bidder)}
                          variant="outline"
                          size="sm"
                          disabled={isDecrypting === bid.bidder}
                          className="w-full"
                        >
                          {isDecrypting === bid.bidder ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Decrypting...
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 mr-2" />
                              Decrypt
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Find Lowest Bid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingDown className="w-8 h-8 text-accent" />
                Find Lowest Bid
              </CardTitle>
              <CardDescription className="text-base">
                Calculate the lowest bid using FHE operations without decrypting individual bids.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleFindLowest}
                disabled={!isConnected || isLoading || bids.length === 0}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {message || "Calculating..."}
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Find Lowest Bid
                  </>
                )}
              </Button>

              {lowestBid && lowestBid.exists && (
                <div className="p-6 bg-accent/10 rounded-lg space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Encrypted Lowest Bid</p>
                    <p className="font-mono text-accent text-xs break-all">{lowestBid.encryptedPrice}</p>
                  </div>
                  {decryptedLowest !== null && isOrganizer && (
                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Decrypted Lowest Bid</p>
                      <p className="text-3xl font-bold text-success">{decryptedLowest}</p>
                    </div>
                  )}
                  {isOrganizer && decryptedLowest === null && (
                    <Button
                      onClick={async () => {
                        try {
                          const decrypted = await decryptBid(lowestBid.encryptedPrice);
                          setDecryptedLowest(decrypted);
                        } catch (error: any) {
                          toast({
                            title: "Decryption Error",
                            description: error.message || "Failed to decrypt lowest bid.",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Decrypt Lowest Bid
                    </Button>
                  )}
                </div>
              )}

              {!contractAddress && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Contract address not configured. Please set VITE_CONTRACT_ADDRESS environment variable or deploy
                    the contract.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="w-16 h-16 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Privacy-Preserving Tender Process</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our encrypted bidding system ensures that all bid prices remain confidential until the organizer decrypts
            them. The lowest bid can be calculated using FHE operations without revealing individual bid amounts.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-success/10 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Fully Homomorphic Encryption</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
