"use client";

import React, { useState, useEffect } from "react";
import { BorderBeam, BorderBeamProps } from "border-beam";

export default function SafeBorderBeam({ children, ...props }: BorderBeamProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <BorderBeam {...props}>{children}</BorderBeam>;
}
