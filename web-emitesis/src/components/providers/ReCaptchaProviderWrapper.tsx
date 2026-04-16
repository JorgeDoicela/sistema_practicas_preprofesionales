'use client';

import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface ReCaptchaProviderWrapperProps {
  children: React.ReactNode;
}

export function ReCaptchaProviderWrapper({ children }: ReCaptchaProviderWrapperProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      language="es"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
