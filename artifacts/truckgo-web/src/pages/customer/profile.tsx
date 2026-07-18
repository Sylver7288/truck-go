import { useAuth } from "@/hooks/use-auth";
import { useGetMe, getGetMeQueryKey, useGetBookingSummary, getGetBookingSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, LogOut } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const { data: profile, isLoading } = useGetMe(
    { userId: user.userId, role: user.role },
    { query: { enabled: !!user.userId, queryKey: getGetMeQueryKey({ userId: user.userId, role: user.role }) } }
  );

  const { data: summary } = useGetBookingSummary(
    { customerId: user.userId },
    { query: { enabled: user.role === "customer", queryKey: getGetBookingSummaryQueryKey({ customerId: user.userId }) } }
  );

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto py-12 px-4 animate-pulse"><div className="h-48 bg-slate-100 rounded-xl"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">My Profile</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-amber-400"></div>
            <CardContent className="pt-0 relative px-6 pb-6 text-center">
              <div className="mx-auto w-24 h-24 rounded-full border-4 border-white bg-secondary text-white flex items-center justify-center text-3xl font-bold -mt-12 mb-4 shadow-sm">
                {profile?.name?.charAt(0) || user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-secondary">{profile?.name || user.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role || user.role}</p>
              
              <div className="mt-6">
                <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary">{profile?.email || user.email}</div>
                  <div className="text-xs text-muted-foreground">Email Address</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-muted-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary">{profile?.phone || "Not provided"}</div>
                  <div className="text-xs text-muted-foreground">Phone Number</div>
                </div>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary">{formatDate(profile.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">Member Since</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {user.role === "customer" && summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-3xl font-bold text-secondary">{summary.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-3xl font-bold text-primary">{formatCurrency(summary.totalSpent)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
