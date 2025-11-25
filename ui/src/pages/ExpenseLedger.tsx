import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useExpenseLedger } from "@/hooks/useExpenseLedger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, DollarSign, Lock, Unlock, RefreshCw } from "lucide-react";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function ExpenseLedger() {
  const { address, isConnected } = useAccount();
  const {
    isLoading,
    message,
    recordExpense,
    getDailyExpense,
    calculateWeeklyTotal,
    decryptExpense,
    isProjectManager,
  } = useExpenseLedger(CONTRACT_ADDRESS);

  // Show configuration message if contract address is not set
  if (!CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Trust Build Ledger</h1>
              </div>
              <ConnectButton />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-yellow-500" />
                Contract Address Not Configured
              </CardTitle>
              <CardDescription>
                Please deploy the contract and configure the contract address to use the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    <strong>Deploy the contract:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                      npx hardhat deploy --network localhost
                    </pre>
                  </li>
                  <li>
                    <strong>Copy the contract address</strong> from the deployment output
                  </li>
                  <li>
                    <strong>Create <code className="bg-background px-1 rounded">ui/.env.local</code></strong> file with:
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                      VITE_CONTRACT_ADDRESS=0x...
                    </pre>
                  </li>
                  <li>
                    <strong>Restart the dev server</strong> for changes to take effect
                  </li>
                </ol>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Note:</strong> Make sure Hardhat node is running:
                </p>
                <pre className="p-2 bg-background rounded text-xs overflow-x-auto">
                  npx hardhat node
                </pre>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [materialCost, setMaterialCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [rentalCost, setRentalCost] = useState("");

  const [viewDate, setViewDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyExpense, setDailyExpense] = useState<{
    materialCost: string;
    laborCost: string;
    rentalCost: string;
    exists: boolean;
  } | null>(null);

  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const weekStart = new Date(today.setDate(diff));
    return weekStart.toISOString().split("T")[0];
  });
  const [weeklyTotal, setWeeklyTotal] = useState<{
    materialCost: string;
    laborCost: string;
    rentalCost: string;
  } | null>(null);

  const [decryptedValues, setDecryptedValues] = useState<{
    material?: number;
    labor?: number;
    rental?: number;
    weeklyMaterial?: number;
    weeklyLabor?: number;
    weeklyRental?: number;
  }>({});

  const handleRecordExpense = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!materialCost || !laborCost || !rentalCost) {
      toast.error("Please fill in all expense fields");
      return;
    }

    try {
      const dateInDays = Math.floor(new Date(date).getTime() / 86400000);
      await recordExpense(
        dateInDays,
        parseInt(materialCost),
        parseInt(laborCost),
        parseInt(rentalCost)
      );
      toast.success("Expense recorded successfully!");
      setMaterialCost("");
      setLaborCost("");
      setRentalCost("");
    } catch (error: any) {
      toast.error(error.message || "Failed to record expense");
    }
  };

  const handleViewDailyExpense = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const dateInDays = Math.floor(new Date(viewDate).getTime() / 86400000);
      const expense = await getDailyExpense(dateInDays);
      setDailyExpense(expense);
      if (expense && !expense.exists) {
        toast.info("No expense recorded for this date");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch expense");
    }
  };

  const handleCalculateWeeklyTotal = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const dateInDays = Math.floor(new Date(weekStartDate).getTime() / 86400000);
      const total = await calculateWeeklyTotal(dateInDays);
      setWeeklyTotal(total);
      if (total) {
        toast.success("Weekly total calculated");
        
        // If user is project manager, automatically decrypt all values
        if (isProjectManager) {
          console.log("[ExpenseLedger] User is project manager, starting auto-decrypt");
          console.log("[ExpenseLedger] Encrypted values:", {
            material: total.materialCost,
            labor: total.laborCost,
            rental: total.rentalCost,
          });
          
          // Wait a bit for permissions to be fully set (FHE operations need time)
          toast.info("Waiting for permissions, then decrypting...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          toast.info("Decrypting weekly totals...");
          console.log("[ExpenseLedger] Starting decryption process");
          
          try {
            // Decrypt all three values sequentially to avoid rate limiting
            console.log("[ExpenseLedger] Step 1: Decrypting material cost...", total.materialCost);
            const material = await decryptExpense(total.materialCost);
            console.log("[ExpenseLedger] ✓ Material decrypted:", material);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("[ExpenseLedger] Step 2: Decrypting labor cost...", total.laborCost);
            const labor = await decryptExpense(total.laborCost);
            console.log("[ExpenseLedger] ✓ Labor decrypted:", labor);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("[ExpenseLedger] Step 3: Decrypting rental cost...", total.rentalCost);
            const rental = await decryptExpense(total.rentalCost);
            console.log("[ExpenseLedger] ✓ Rental decrypted:", rental);
            
            console.log("[ExpenseLedger] All decrypted values:", { material, labor, rental });
            
            // Force state update with a new object to ensure React detects the change
            const newDecryptedValues = {
              ...decryptedValues,
              weeklyMaterial: material,
              weeklyLabor: labor,
              weeklyRental: rental,
            };
            
            console.log("[ExpenseLedger] Setting decrypted values:", newDecryptedValues);
            setDecryptedValues(newDecryptedValues);
            
            // Double check the state was updated
            setTimeout(() => {
              console.log("[ExpenseLedger] Current decryptedValues after update:", decryptedValues);
            }, 100);
            
            console.log("[ExpenseLedger] ✓ State updated with decrypted values");
            toast.success(`Weekly totals decrypted: Material $${material}, Labor $${labor}, Rental $${rental}`);
          } catch (decryptError: any) {
            console.error("[ExpenseLedger] ✗ Error auto-decrypting weekly totals:", decryptError);
            console.error("[ExpenseLedger] Error details:", {
              message: decryptError.message,
              stack: decryptError.stack,
              error: decryptError,
            });
            toast.error(`Decryption failed: ${decryptError.message || "Unknown error"}. Check console for details.`);
          }
        } else {
          console.log("[ExpenseLedger] User is not project manager, skipping auto-decrypt");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to calculate weekly total");
    }
  };

  const handleDecrypt = async (encryptedValue: string, type: string) => {
    if (!isProjectManager) {
      toast.error("Only project manager can decrypt expenses");
      return;
    }

    try {
      const decrypted = await decryptExpense(encryptedValue);
      setDecryptedValues((prev) => ({ ...prev, [type]: decrypted }));
      toast.success(`Decrypted ${type}: ${decrypted}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to decrypt");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Trust Build Ledger</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isConnected && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please connect your wallet to use the expense ledger
              </p>
            </CardContent>
          </Card>
        )}

        {isProjectManager && (
          <Card className="mb-6 border-green-500">
            <CardContent className="pt-6">
              <p className="text-center text-green-600 font-semibold">
                You are the Project Manager - You can decrypt expenses
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="record" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record">Record Expense</TabsTrigger>
            <TabsTrigger value="view">View Expenses</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Total</TabsTrigger>
          </TabsList>

          <TabsContent value="record">
            <Card>
              <CardHeader>
                <CardTitle>Record Daily Expense</CardTitle>
                <CardDescription>
                  Enter material, labor, and rental costs for the day. All values are encrypted on-chain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material Cost</Label>
                  <Input
                    id="material"
                    type="number"
                    placeholder="Enter material cost"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor">Labor Cost</Label>
                  <Input
                    id="labor"
                    type="number"
                    placeholder="Enter labor cost"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental">Rental Cost</Label>
                  <Input
                    id="rental"
                    type="number"
                    placeholder="Enter rental cost"
                    value={rentalCost}
                    onChange={(e) => setRentalCost(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRecordExpense}
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  {isLoading ? "Recording..." : "Record Expense"}
                </Button>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle>View Daily Expense</CardTitle>
                <CardDescription>
                  View encrypted expenses for a specific date. Only project manager can decrypt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="view-date">Date</Label>
                  <div className="flex gap-2">
                    <Input
                      id="view-date"
                      type="date"
                      value={viewDate}
                      onChange={(e) => setViewDate(e.target.value)}
                    />
                    <Button onClick={handleViewDailyExpense} disabled={isLoading || !isConnected}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                  </div>
                </div>

                {dailyExpense && dailyExpense.exists && (
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Material Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs font-mono break-all mb-2">
                            {dailyExpense.materialCost}
                          </p>
                          {isProjectManager && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecrypt(dailyExpense.materialCost, "material")}
                              disabled={isLoading}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Decrypt
                            </Button>
                          )}
                          {decryptedValues.material !== undefined && (
                            <p className="mt-2 text-lg font-bold text-green-600">
                              ${decryptedValues.material}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Labor Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs font-mono break-all mb-2">
                            {dailyExpense.laborCost}
                          </p>
                          {isProjectManager && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecrypt(dailyExpense.laborCost, "labor")}
                              disabled={isLoading}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Decrypt
                            </Button>
                          )}
                          {decryptedValues.labor !== undefined && (
                            <p className="mt-2 text-lg font-bold text-green-600">
                              ${decryptedValues.labor}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Rental Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs font-mono break-all mb-2">
                            {dailyExpense.rentalCost}
                          </p>
                          {isProjectManager && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecrypt(dailyExpense.rentalCost, "rental")}
                              disabled={isLoading}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Decrypt
                            </Button>
                          )}
                          {decryptedValues.rental !== undefined && (
                            <p className="mt-2 text-lg font-bold text-green-600">
                              ${decryptedValues.rental}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {dailyExpense && !dailyExpense.exists && (
                  <p className="text-center text-muted-foreground py-4">
                    No expense recorded for this date
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Total</CardTitle>
                <CardDescription>
                  Calculate encrypted weekly total expenses. Only project manager can decrypt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="week-start">Week Start Date</Label>
                  <div className="flex gap-2">
                    <Input
                      id="week-start"
                      type="date"
                      value={weekStartDate}
                      onChange={(e) => setWeekStartDate(e.target.value)}
                    />
                    <Button onClick={handleCalculateWeeklyTotal} disabled={isLoading || !isConnected}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Calculate
                    </Button>
                  </div>
                </div>

                {weeklyTotal && (
                  <div className="space-y-4 pt-4">
                    {isProjectManager && (
                      decryptedValues.weeklyMaterial === undefined ||
                      decryptedValues.weeklyLabor === undefined ||
                      decryptedValues.weeklyRental === undefined
                    ) && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-3 font-medium">
                          Decrypt weekly totals to view the actual amounts
                        </p>
                        <Button
                          onClick={async () => {
                            if (!weeklyTotal) return;
                            try {
                              toast.info("Decrypting all weekly totals...");
                              setIsLoading(true);
                              
                              // Wait a bit for permissions
                              await new Promise(resolve => setTimeout(resolve, 2000));
                              
                              const [material, labor, rental] = await Promise.all([
                                decryptExpense(weeklyTotal.materialCost),
                                decryptExpense(weeklyTotal.laborCost),
                                decryptExpense(weeklyTotal.rentalCost),
                              ]);
                              
                              setDecryptedValues((prev) => ({
                                ...prev,
                                weeklyMaterial: material,
                                weeklyLabor: labor,
                                weeklyRental: rental,
                              }));
                              
                              toast.success(`Decrypted: Material $${material}, Labor $${labor}, Rental $${rental}`);
                            } catch (error: any) {
                              console.error("[ExpenseLedger] Manual decrypt error:", error);
                              toast.error(`Decryption failed: ${error.message || "Unknown error"}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={isLoading}
                          className="w-full"
                          size="lg"
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Decrypt All Weekly Totals
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total Material</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {decryptedValues.weeklyMaterial !== undefined ? (
                            <div>
                              <p className="text-3xl font-bold text-green-600 mb-2">
                                ${decryptedValues.weeklyMaterial.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                {weeklyTotal.materialCost}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-mono break-all mb-2">
                                {weeklyTotal.materialCost}
                              </p>
                              {isProjectManager && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecrypt(weeklyTotal.materialCost, "weeklyMaterial")}
                                  disabled={isLoading}
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Decrypt
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total Labor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {decryptedValues.weeklyLabor !== undefined ? (
                            <div>
                              <p className="text-3xl font-bold text-green-600 mb-2">
                                ${decryptedValues.weeklyLabor.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                {weeklyTotal.laborCost}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-mono break-all mb-2">
                                {weeklyTotal.laborCost}
                              </p>
                              {isProjectManager && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecrypt(weeklyTotal.laborCost, "weeklyLabor")}
                                  disabled={isLoading}
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Decrypt
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total Rental</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {decryptedValues.weeklyRental !== undefined ? (
                            <div>
                              <p className="text-3xl font-bold text-green-600 mb-2">
                                ${decryptedValues.weeklyRental.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                {weeklyTotal.rentalCost}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-mono break-all mb-2">
                                {weeklyTotal.rentalCost}
                              </p>
                              {isProjectManager && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecrypt(weeklyTotal.rentalCost, "weeklyRental")}
                                  disabled={isLoading}
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Decrypt
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

