import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const ok = await login(email, password);
    setIsSubmitting(false);
    if (ok) {
      setLocation("/admin");
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">TruckGo Admin</span>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800 text-white shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-slate-400">Restricted access — authorised personnel only</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-slate-300" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@truckgo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300" htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-11 mt-2">
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
