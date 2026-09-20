declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        expand: () => void;
        close: () => void;
        ready: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
        openTelegramLink: (url: string) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const getTelegramWebApp = () => {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
};

export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    return {
      id: u.id.toString(),
      firstName: u.first_name,
      username: u.username || '',
      photoUrl: u.photo_url
    };
  }

  // Fallback for browser testing
  return {
    id: 'test_player_1',
    firstName: 'Игрок',
    username: 'poker_pro',
    photoUrl: undefined
  };
};

export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy'),
  success: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success'),
  warning: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning'),
  error: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error'),
};
