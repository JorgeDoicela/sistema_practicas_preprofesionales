'use client';

import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface ReCaptchaProviderWrapperProps {
  children: React.ReactNode;
}

export function ReCaptchaProviderWrapper({ children }: ReCaptchaProviderWrapperProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6Lej8bosAAAAAHS1jnehMjfBm1FZ6a6a__3Yuteg";
  
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
