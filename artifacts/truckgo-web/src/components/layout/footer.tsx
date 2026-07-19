import { Link } from "wouter";
import { Truck, HelpCircle, Mail, MessageSquare, Shield, Star } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-foreground tracking-tight">TruckGo</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Same-day freight delivery with vetted, insured drivers.
            </p>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Support</p>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" /> FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-3.5 w-3.5" /> Contact Us
                </Link>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("chat-widget-trigger")?.click()}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Live Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Company</p>
            <ul className="space-y-2">
              <li>
                <Link href="/register-driver" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Truck className="h-3.5 w-3.5" /> Become a Driver
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" /> Privacy Policy
                </span>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5" /> Terms of Service
                </span>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1800 TRUCKGO</li>
              <li>support@truckgo.com</li>
              <li>Mon–Sun, 7am – 10pm AEST</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} TruckGo. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Freight delivered with care.</p>
        </div>
      </div>
    </footer>
  );
}
