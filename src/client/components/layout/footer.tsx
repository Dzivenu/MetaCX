"use client";

import React from "react";
import Link from "next/link";

// Simple BrandLogo component
const BrandLogo = () => (
  <span className="text-xl font-bold text-primary">Gracious</span>
);

export function AppFooter() {
  return (
    <footer className="bg-base-200 text-base-content p-10 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-between gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="flex flex-col items-start max-w-sm">
            <BrandLogo />
            <p className="mt-4 text-base-content/80">
              Gracious - Create beautiful websites effortlessly with our
              intuitive platform.
            </p>
            <p className="text-sm text-base-content/60 mt-2">
              © 2024 Gracious. All rights reserved.
            </p>
          </div>

          {/* Footer Links - Horizontal Layout */}
          <div className="flex flex-wrap gap-8 md:gap-12">
            {/* Product */}
            <nav className="flex flex-col min-w-[120px]">
              <h6 className="text-base-content font-semibold mb-4 text-sm uppercase tracking-wider">
                Product
              </h6>
              <Link
                href="/create/site"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Create Site
              </Link>
              <Link
                href="/templates"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Templates
              </Link>
              <Link
                href="/features"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Pricing
              </Link>
            </nav>

            {/* Company */}
            <nav className="flex flex-col min-w-[120px]">
              <h6 className="text-base-content font-semibold mb-4 text-sm uppercase tracking-wider">
                Company
              </h6>
              <Link
                href="/about"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Contact
              </Link>
              <Link
                href="/careers"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Careers
              </Link>
              <Link
                href="/blog"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Blog
              </Link>
            </nav>

            {/* Support */}
            <nav className="flex flex-col min-w-[120px]">
              <h6 className="text-base-content font-semibold mb-4 text-sm uppercase tracking-wider">
                Support
              </h6>
              <Link
                href="/help"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Help Center
              </Link>
              <Link
                href="/docs"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Documentation
              </Link>
              <Link
                href="/community"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Community
              </Link>
              <Link
                href="/status"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Status
              </Link>
            </nav>

            {/* Legal */}
            <nav className="flex flex-col min-w-[120px]">
              <h6 className="text-base-content font-semibold mb-4 text-sm uppercase tracking-wider">
                Legal
              </h6>
              <Link
                href="/privacy"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="link link-hover text-base-content/80 hover:text-primary mb-2"
              >
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
