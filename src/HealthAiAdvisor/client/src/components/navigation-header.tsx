import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { PillBottle, Menu } from "lucide-react";
import { useState } from "react";

export function NavigationHeader() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  const handleNewAssessment = () => {
    window.location.href = "/questionnaire";
  };

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/bloodwork", label: "Bloodwork", active: location === "/bloodwork" },
    { href: "/recommendations", label: "Recommendations", active: location === "/recommendations" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <PillBottle className="text-white h-6 w-6" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800">Decent4</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`transition-colors cursor-pointer ${
                  item.active 
                    ? "text-primary font-medium" 
                    : "text-neutral-600 hover:text-primary"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
            
            <Button 
              onClick={handleNewAssessment}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              New Assessment
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-neutral-600 hover:text-neutral-800"
            >
              Sign Out
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5 text-neutral-600" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4">
            <nav className="space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={`block px-3 py-2 text-base cursor-pointer ${
                      item.active 
                        ? "text-primary font-medium bg-primary/5" 
                        : "text-neutral-600"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}
              
              <div className="px-3 py-2 space-y-2">
                <Button 
                  onClick={() => {
                    handleNewAssessment();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-white hover:bg-primary-dark"
                  size="sm"
                >
                  New Assessment
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
