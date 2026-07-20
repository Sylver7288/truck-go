import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, MailWarning, Truck } from "lucide-react";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Checking your verification link...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Verification failed.");
        setState("success");
        setMessage("Your email is verified. You can now log in to TruckGo.");
      })
      .catch((error: Error) => {
        setState("error");
        setMessage(error.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-3xl text-primary tracking-tight">
            <Truck className="h-8 w-8" />
            <span>TruckGo</span>
          </Link>
        </div>

        <Card className="border-none shadow-xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {state === "loading" ? <Loader2 className="h-7 w-7 animate-spin" /> : state === "success" ? <CheckCircle2 className="h-7 w-7" /> : <MailWarning className="h-7 w-7" />}
            </div>
            <CardTitle>{state === "success" ? "Email verified" : state === "error" ? "Verification issue" : "Verifying email"}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent />
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
