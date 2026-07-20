import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ThemeProvider } from '@/hooks/use-theme';

// Customer pages
import Home from '@/pages/customer/home';
import Bookings from '@/pages/customer/bookings';
import BookingDetail from '@/pages/customer/booking-detail';
import Profile from '@/pages/customer/profile';
import Faq from '@/pages/faq';
import Contact from '@/pages/contact';
import Login from '@/pages/login';
import Register from '@/pages/register';
import RegisterDriver from '@/pages/register-driver';
import { ChatWidget } from '@/components/chat/ChatWidget';

// Driver pages
import DriverDashboard from '@/pages/driver/dashboard';
import DriverJobs from '@/pages/driver/jobs';
import JobDetail from '@/pages/driver/job-detail';

// Admin pages
import AdminLogin from '@/pages/admin/login';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminBookings from '@/pages/admin/bookings';
import AdminDrivers from '@/pages/admin/drivers';
import AdminCustomers from '@/pages/admin/customers';
import AdminMessages from '@/pages/admin/messages';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isChecking, checkSession } = useAdminAuth();

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (isChecking) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isAdminArea = location.startsWith('/admin');

  if (isAdminArea) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/bookings"><AdminRoute component={AdminBookings} /></Route>
        <Route path="/admin/drivers"><AdminRoute component={AdminDrivers} /></Route>
        <Route path="/admin/customers"><AdminRoute component={AdminCustomers} /></Route>
        <Route path="/admin/messages"><AdminRoute component={AdminMessages} /></Route>
        <Route path="/admin"><AdminRoute component={AdminDashboard} /></Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/register-driver" component={RegisterDriver} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/bookings/:id" component={BookingDetail} />
          <Route path="/profile" component={Profile} />
          <Route path="/faq" component={Faq} />
          <Route path="/contact" component={Contact} />
          <Route path="/driver" component={DriverDashboard} />
          <Route path="/driver/jobs" component={DriverJobs} />
          <Route path="/driver/jobs/:id" component={JobDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
