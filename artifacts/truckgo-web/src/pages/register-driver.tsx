import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRegisterDriver, useListTruckTypes } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterDriver() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [truckTypeId, setTruckTypeId] = useState("");

  const { data: truckTypes } = useListTruckTypes();
  const registerMutation = useRegisterDriver();
  const mutateFnRef = useRef(registerMutation.mutate);
  mutateFnRef.current = registerMutation.mutate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !licenseNumber || !vehiclePlate || !truckTypeId) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    mutateFnRef.current(
      { 
        data: { 
          name, 
          email, 
          phone, 
          password,
          licenseNumber,
          vehiclePlate,
          vehicleYear: vehicleYear ? parseInt(vehicleYear, 10) : undefined,
          truckTypeId: parseInt(truckTypeId, 10)
        } 
      },
      {
        onSuccess: (data) => {
          login({ userId: data.userId, role: data.role, name: data.name, email: data.email });
          setLocation("/driver");
          toast({ title: "Driver Account created!", description: `Welcome to TruckGo, ${data.name}` });
        },
        onError: () => {
          toast({ title: "Registration failed", description: "Please try again", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-3xl text-primary tracking-tight">
            <Truck className="h-8 w-8" />
            <span>TruckGo Driver</span>
          </Link>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Become a Driver</CardTitle>
            <CardDescription>Join the network and start earning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Personal Info</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license">License Number</Label>
                    <Input id="license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Vehicle Info</h3>
                  <div className="space-y-2">
                    <Label htmlFor="truckType">Truck Type</Label>
                    <Select value={truckTypeId} onValueChange={setTruckTypeId}>
                      <SelectTrigger id="truckType">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {truckTypes?.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plate">Vehicle Plate</Label>
                    <Input id="plate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Vehicle Year (Optional)</Label>
                    <Input id="year" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-11 text-lg" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Apply to Drive"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center">
            <div className="text-sm text-muted-foreground">
              Want to book a truck instead?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Customer Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
