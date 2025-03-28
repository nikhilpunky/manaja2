import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-primary text-2xl font-bold font-display">
                Pledgenfetch
              </a>
            </Link>
          </div>
          
          {/* Navigation for desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/" ? "text-primary" : ""}`}>
                Home
              </a>
            </Link>
            <Link href="/apply">
              <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/apply" ? "text-primary" : ""}`}>
                Apply for Loan
              </a>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard">
                <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/dashboard" ? "text-primary" : ""}`}>
                  Dashboard
                </a>
              </Link>
            )}
            <Link href="/#help">
              <a className="text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm">
                Help
              </a>
            </Link>
          </nav>
          
          {/* Login/profile button */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                      <Avatar>
                        <AvatarFallback className="bg-primary-light text-white">
                          {user?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar>
                        <AvatarFallback className="bg-primary-light text-white">
                          {user?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <a className="w-full cursor-pointer">Dashboard</a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/apply">
                        <a className="w-full cursor-pointer">Apply for Loan</a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button>Login / Register</Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-left">Pledgenfetch</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <div className="flex flex-col space-y-3">
                    <Link href="/">
                      <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/" ? "text-primary" : ""}`}>
                        Home
                      </a>
                    </Link>
                    <Link href="/apply">
                      <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/apply" ? "text-primary" : ""}`}>
                        Apply for Loan
                      </a>
                    </Link>
                    {isAuthenticated && (
                      <Link href="/dashboard">
                        <a className={`text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm ${location === "/dashboard" ? "text-primary" : ""}`}>
                          Dashboard
                        </a>
                      </Link>
                    )}
                    <Link href="/#help">
                      <a className="text-neutral-dark font-medium hover:text-primary px-3 py-2 rounded-md text-sm">
                        Help
                      </a>
                    </Link>
                    {isAuthenticated ? (
                      <a 
                        className="text-neutral-dark font-medium hover:text-red-500 px-3 py-2 rounded-md text-sm"
                        onClick={() => logout()}
                      >
                        Logout
                      </a>
                    ) : (
                      <Link href="/login">
                        <a className="text-primary font-medium px-3 py-2 rounded-md text-sm">
                          Login / Register
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
