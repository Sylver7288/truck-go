import { useAuth } from "@/hooks/use-auth";
import { useListDriverJobs, getListDriverJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { MapPin, ArrowRight, Truck } from "lucide-react";
import { useState } from "react";

export default function DriverJobs() {
  const { user } = useAuth();
  const driverId = user?.userId || 0;
  const [tab, setTab] = useState("active");

  const { data: jobs, isLoading } = useListDriverJobs(
    driverId,
    { query: { enabled: !!driverId, queryKey: getListDriverJobsQueryKey(driverId) } }
  );

  if (!user || user.role !== "driver") return null;

  const filteredJobs = jobs?.filter(job => {
    if (tab === "active") return ["accepted", "in_progress"].includes(job.status);
    if (tab === "completed") return job.status === "completed";
    return true; // "all"
  }) || [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Job Board</h1>
        <p className="text-muted-foreground mt-2">Manage your assigned and completed deliveries.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active ({jobs?.filter(j => ["accepted", "in_progress"].includes(j.status)).length || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({jobs?.filter(j => j.status === "completed").length || 0})</TabsTrigger>
          <TabsTrigger value="all">All ({jobs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card shadow-sm">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-secondary">No jobs found</h3>
              <p className="text-muted-foreground mt-1">
                {tab === "active" ? "You don't have any active jobs right now. Stay online to receive requests." : "No jobs match this filter."}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Link key={job.id} href={`/driver/jobs/${job.id}`}>
                <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                              {job.status.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-medium">#{job.id}</span>
                          </div>
                          <div className="font-bold text-lg text-primary">
                            {formatCurrency(job.finalPrice || job.estimatedPrice)}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3 relative">
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                              <div className="text-sm truncate">
                                <p className="font-medium text-secondary truncate">{job.pickupAddress}</p>
                              </div>
                            </div>
                            <div className="absolute left-2.5 top-6 bottom-6 w-px bg-border -z-10"></div>
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                              <div className="text-sm truncate">
                                <p className="font-medium text-secondary truncate">{job.dropoffAddress}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center border-l pl-4 border-dashed">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Customer:</span> <span className="font-medium">{job.customerName}</span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="text-muted-foreground">Distance:</span> <span className="font-medium">{job.distanceKm} km</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-3">
                              {formatDate(job.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center justify-center p-6 border-l bg-slate-50/50 group-hover:bg-primary/5 transition-colors">
                        <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
