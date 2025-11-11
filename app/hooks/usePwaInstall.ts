'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // Android/desktop PWA
  const isDisplayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  // iOS Safari
  const isIOSStandalone = (window as any).navigator?.standalone === true;
  return isDisplayModeStandalone || isIOSStandalone;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // capture beforeinstallprompt on Android/Chrome
  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIOSHelp(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // re-check when tab becomes visible (in case userติดตั้งไปแล้ว)
    const onVisibility = () => setInstalled(isStandalone());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const canInstall = useMemo(() => {
    if (installed) return false;
    if (!isMobile()) return false;
    // Android/Chrome: มี deferredPrompt ถึงจะขึ้นปุ่ม
    if (!isIOS() && deferredPrompt) return true;
    // iOS: ไม่มี deferredPrompt—ให้แสดงปุ่มเพื่อนำไปสู่คำแนะนำ
    if (isIOS()) return true;
    return false;
  }, [installed, deferredPrompt]);

  const requestInstall = useCallback(async () => {
    if (installed) return;

    if (isIOS()) {
      // iOS ไม่มี prompt—เปิดคำแนะนำ
      setShowIOSHelp(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
        }
      } finally {
        // หลังเรียก prompt แล้ว browser จะใช้ object เดิมไม่ได้อีก
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt, installed]);

  const closeIOSHelp = useCallback(() => setShowIOSHelp(false), []);

  return {
    canInstall,
    installed,
    requestInstall,
    showIOSHelp,
    closeIOSHelp,
    isIOS: isIOS(),
  };
}
