import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function useI18n() {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Update document language
    document.documentElement.lang = lng;
    
    // Update date/time formatting
    const event = new CustomEvent('languageChanged', { detail: { language: lng } });
    window.dispatchEvent(event);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(number);
  };

  useEffect(() => {
    // Set initial language from localStorage or browser
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      changeLanguage(savedLanguage);
    }
  }, []);

  return {
    t,
    language: i18n.language,
    changeLanguage,
    formatDate,
    formatCurrency,
    formatNumber,
    isRTL: ['ar', 'he', 'fa'].includes(i18n.language)
  };
}