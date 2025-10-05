import { auth } from "@/server/db/better-auth";

import { NextRequest } from "next/server";

export const GET = auth.handler;
export const POST = async (request: NextRequest) => {
  // Add comprehensive debugging for all auth requests
  const url = new URL(request.url);

  

  
  return auth.handler(request);
};