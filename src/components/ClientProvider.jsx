"use client";
import React from 'react';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "../providers/theme-provider";

const ClientProvider = ({ children }) => {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

export default ClientProvider;
