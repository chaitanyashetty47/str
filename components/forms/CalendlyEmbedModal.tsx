"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, X, Loader2 } from "lucide-react";

interface CalendlyEmbedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget?: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: { email?: string };
        utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
      }) => void;
    };
  }
}

export const CalendlyEmbedModal: React.FC<CalendlyEmbedModalProps> = ({ 
  open, 
  onOpenChange, 
  userEmail 
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const initializationRef = useRef<boolean>(false);

  useEffect(() => {
    // Manage body scroll when modal opens/closes
    if (open) {
      document.body.classList.add('calendly-modal-open');
    } else {
      document.body.classList.remove('calendly-modal-open');
    }

    return () => {
      document.body.classList.remove('calendly-modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setIsLoading(false);
      setIsInitialized(false);
      setHasError(false);
      initializationRef.current = false;
      cleanupCalendly();
      return;
    }

    // Prevent multiple initializations
    if (initializationRef.current) return;
    
    // Initialize Calendly when modal opens
    initializationRef.current = true;
    initializeCalendlyWidget();

  }, [open]);

  // Separate effect for userEmail changes
  useEffect(() => {
    if (open && isInitialized && userEmail) {
      // Reinitialize if email changes while modal is open
      initializeCalendlyWidget();
    }
  }, [userEmail]);

  const cleanupCalendly = () => {
    if (embedRef.current) {
      // More gentle cleanup - don't completely clear innerHTML
      const calendlyElements = embedRef.current.querySelectorAll('.calendly-inline-widget, iframe');
      calendlyElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    }
  };

  const initializeCalendlyWidget = async () => {
    if (!embedRef.current || !open) return;

    try {
      setIsLoading(true);
      setIsInitialized(false);
      setHasError(false);

      // Ensure Calendly script is loaded
      await loadCalendlyScript();
      
      // Wait for Calendly to be fully ready and DOM to be stable
      await waitForCalendlyReady();
      
      // Check if modal is still open before proceeding
      if (!open || !embedRef.current) {
        setIsLoading(false);
        return;
      }

      // Clean any existing content
      cleanupCalendly();
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize the widget
      if (window.Calendly?.initInlineWidget) {
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/strentor/strentor-services',
          parentElement: embedRef.current,
          prefill: {
            email: userEmail
          },
          utm: {
            utmSource: 'website',
            utmMedium: 'inline_embed',
            utmCampaign: 'discovery_call'
          }
        });
      }
      
      setIsInitialized(true);
      setIsLoading(false);
        
    } catch (error) {
      console.error('Error initializing Calendly:', error);
      setIsLoading(false);
      setIsInitialized(false);
      setHasError(true);
    }
  };

  const waitForCalendlyReady = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // Increased attempts but shorter intervals
      
      const checkReady = () => {
        attempts++;
        
        // Check if Calendly is available and has the required methods
        if (window.Calendly?.initInlineWidget && 
            typeof window.Calendly.initInlineWidget === 'function' &&
            embedRef.current) {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Calendly not ready after timeout'));
          return;
        }
        
        setTimeout(checkReady, 100); // Reduced from 500ms to 100ms
      };
      
      checkReady();
    });
  };

  const loadCalendlyScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If Calendly is already loaded and ready, resolve immediately
      if (window.Calendly?.initInlineWidget) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        // Script exists, wait for it to load and Calendly to be ready
        let checkAttempts = 0;
        const maxCheckAttempts = 30;
        
        const checkExistingScript = () => {
          checkAttempts++;
          if (window.Calendly?.initInlineWidget) {
            resolve();
          } else if (checkAttempts >= maxCheckAttempts) {
            reject(new Error('Existing Calendly script failed to load'));
          } else {
            setTimeout(checkExistingScript, 100);
          }
        };
        checkExistingScript();
        return;
      }

      // Create and load new script
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      
      let scriptCheckAttempts = 0;
      const maxScriptCheckAttempts = 30;
      
      script.onload = () => {
        // Script loaded, but wait for Calendly object to be ready
        const checkCalendlyReady = () => {
          scriptCheckAttempts++;
          if (window.Calendly?.initInlineWidget) {
            resolve();
          } else if (scriptCheckAttempts >= maxScriptCheckAttempts) {
            reject(new Error('Calendly object not ready after script load'));
          } else {
            setTimeout(checkCalendlyReady, 100);
          }
        };
        checkCalendlyReady();
      };
      
      script.onerror = () => reject(new Error('Failed to load Calendly script'));
      
      document.head.appendChild(script);
    });
  };

  const handleClose = () => {
    cleanupCalendly();
    onOpenChange(false);
  };

  const handleRetry = () => {
    initializationRef.current = false;
    initializeCalendlyWidget();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[95vh] max-h-[900px] sm:h-[90vh] sm:max-h-[800px] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#F31818]" />
              Select Your Preferred Time
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden min-h-0 relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#F31818]" />
                <p className="text-gray-600 font-medium">Loading Calendar...</p>
              </div>
            </div>
          )}
          
          {/* Calendly Container */}
          <div 
            ref={embedRef}
            className="calendly-embed-container"
            style={{ 
              height: 'calc(95vh - 60px)',
              maxHeight: 'calc(900px - 60px)',
              minHeight: '500px',
              opacity: isLoading ? 0.3 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
          
          {/* Error State - Only show if there's actually an error */}
          {!isLoading && !isInitialized && (hasError || (!isLoading && open)) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {hasError ? "Failed to load calendar. Let's try again!" : "Ready to book your appointment?"}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#F31818] text-white rounded-lg hover:bg-[#F31818]/90 transition-colors"
                >
                  {hasError ? "Retry" : "Let's Go"}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};