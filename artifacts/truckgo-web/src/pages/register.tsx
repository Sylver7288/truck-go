import { useState, useRef } from "react";
import { Link } from "wouter";
import { useRegisterCustomer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const registerMutation = useRegisterCustomer();
  const mutateFnRef = useRef(registerMutation.mutate);
  mutateFnRef.current = registerMutation.mutate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    mutateFnRef.current(
      { data: { name, email, phone, password } },
      {
        onSuccess: (data) => {
          setRegisteredEmail(data.email);
          toast({ title: "Account created", description: "Check your email to verify your account before logging in." });
        },
        onError: () => {
          toast({ title: "Registration failed", description: "Please try again", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-3xl text-primary tracking-tight">
            <Truck className="h-8 w-8" />
            <span>TruckGo</span>
          </Link>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Enter your details to start booking trucks</CardDescription>
          </CardHeader>
          <CardContent>
            {registeredEmail ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                We sent a verification link to <span className="font-semibold">{registeredEmail}</span>. Verify your email, then log in.
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Sign up"}
              </Button>
            </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </div>
            <div className="text-xs text-muted-foreground">
              Want to drive for TruckGo? Driver registration is handled internally.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
