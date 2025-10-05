"use client";

import { env } from "@/shared/config/env";
import { use } from "react";

interface SubdomainPageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export default function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = use(params);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to {subdomain}
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          You are accessing the subdomain:{" "}
          <span className="font-semibold text-blue-600">{subdomain}</span>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          This page is dynamically generated based on the subdomain in the URL.
        </p>

        {/* Environment and Subdomain Display */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Subdomain Information
            </h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Subdomain:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {subdomain}
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Environment Information
            </h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">
                Current Environment:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  env.NEXT_PUBLIC_NODE_ENV === "production"
                    ? "bg-green-100 text-green-800"
                    : env.NEXT_PUBLIC_NODE_ENV === "development"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {env.NEXT_PUBLIC_NODE_ENV}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
