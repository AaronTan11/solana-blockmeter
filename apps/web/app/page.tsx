"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Hash, Clock, Database } from "lucide-react";
import { getBlockData, formatTimestamp, formatNumber, type BlockData, ApiError } from "@/lib/api";

export default function Home() {
  const [blockNumber, setBlockNumber] = useState("");
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockNumber.trim()) return;

    setLoading(true);
    setError("");
    setBlockData(null);

    try {
      const data = await getBlockData(blockNumber);
      setBlockData(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to fetch block data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Solana BlockMeter
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get real-time transaction counts and block data from the Solana blockchain
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-md mx-auto mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Block Lookup
            </CardTitle>
            <CardDescription>
              Enter a Solana block number to get transaction count and metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blockNumber">Block Number</Label>
                <Input
                  id="blockNumber"
                  type="number"
                  placeholder="e.g., 359399609"
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  disabled={loading}
                  className="text-lg"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !blockNumber.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Get Block Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="max-w-md mx-auto mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {blockData && (
          <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="w-6 h-6" />
                Block #{formatNumber(blockData.blockNumber)}
              </CardTitle>
              <CardDescription>
                Blockchain data retrieved successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Count - Main Metric */}
              <div className="text-center p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {formatNumber(blockData.transactionCount)}
                </div>
                <div className="text-purple-100">Total Transactions</div>
              </div>

              {/* Block Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Hash className="w-4 h-4" />
                    Block Hash
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                    <code className="text-sm font-mono break-all">
                      {blockData.blockhash}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    Timestamp
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                    <div className="text-sm font-mono">
                      {formatTimestamp(blockData.timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* API Info */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
                Data cached for 10 minutes • Background processing enabled
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>Powered by Solana RPC • Built with Next.js & NestJS</p>
        </div>
      </div>
    </div>
  );
}