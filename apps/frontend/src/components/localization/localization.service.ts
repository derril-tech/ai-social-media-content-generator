import { Injectable, Logger } from '@nestjs/common';
import { createIntl, createIntlCache, IntlShape } from '@formatjs/intl';

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: string;
}

export interface LocalizationResult {
  locale: string;
  direction: 'ltr' | 'rtl';
  messages: Record<string, string>;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: string;
  isRTL: boolean;
  textAlignment: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
  justifyContent: 'flex-start' | 'flex-end';
}

export interface TranslationKey {
  key: string;
  namespace: string;
  defaultValue: string;
  description?: string;
}

export interface EditorLocalization {
  placeholder: string;
  toolbar: {
    bold: string;
    italic: string;
    underline: string;
    link: string;
    hashtag: string;
    emoji: string;
    characterCount: string;
    wordCount: string;
  };
  validation: {
    required: string;
    minLength: string;
    maxLength: string;
    invalidFormat: string;
  };
  actions: {
    save: string;
    cancel: string;
    publish: string;
    schedule: string;
    preview: string;
  };
}

export interface CalendarLocalization {
  months: string[];
  weekdays: string[];
  weekdaysShort: string[];
  today: string;
  yesterday: string;
  tomorrow: string;
  timeSlots: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  actions: {
    createPost: string;
    editPost: string;
    deletePost: string;
    movePost: string;
    copyPost: string;
  };
  status: {
    draft: string;
    scheduled: string;
    published: string;
    failed: string;
  };
}

@Injectable()
export class LocalizationService {
  private readonly logger = new Logger(LocalizationService.name);
  private intlCache = createIntlCache();
  private currentIntl: IntlShape;

  private readonly supportedLocales: LocaleConfig[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: 'HH:mm',
      currency: 'USD',
      numberFormat: 'en-US',
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      direction: 'ltr',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: 'es-ES',
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      direction: 'ltr',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: 'fr-FR',
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      direction: 'ltr',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: 'de-DE',
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      direction: 'rtl',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      currency: 'SAR',
      numberFormat: 'ar-SA',
    },
    {
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      direction: 'rtl',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      currency: 'ILS',
      numberFormat: 'he-IL',
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      direction: 'ltr',
      dateFormat: 'yyyy/MM/dd',
      timeFormat: 'HH:mm',
      currency: 'CNY',
      numberFormat: 'zh-CN',
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      direction: 'ltr',
      dateFormat: 'yyyy/MM/dd',
      timeFormat: 'HH:mm',
      currency: 'JPY',
      numberFormat: 'ja-JP',
    },
  ];

  private readonly messages: Record<string, Record<string, string>> = {
    en: {
      // Editor messages
      'editor.placeholder': 'Write your post content here...',
      'editor.toolbar.bold': 'Bold',
      'editor.toolbar.italic': 'Italic',
      'editor.toolbar.underline': 'Underline',
      'editor.toolbar.link': 'Add Link',
      'editor.toolbar.hashtag': 'Add Hashtag',
      'editor.toolbar.emoji': 'Add Emoji',
      'editor.toolbar.characterCount': 'Characters',
      'editor.toolbar.wordCount': 'Words',
      'editor.validation.required': 'This field is required',
      'editor.validation.minLength': 'Minimum {min} characters required',
      'editor.validation.maxLength': 'Maximum {max} characters allowed',
      'editor.validation.invalidFormat': 'Invalid format',
      'editor.actions.save': 'Save',
      'editor.actions.cancel': 'Cancel',
      'editor.actions.publish': 'Publish',
      'editor.actions.schedule': 'Schedule',
      'editor.actions.preview': 'Preview',

      // Calendar messages
      'calendar.months.january': 'January',
      'calendar.months.february': 'February',
      'calendar.months.march': 'March',
      'calendar.months.april': 'April',
      'calendar.months.may': 'May',
      'calendar.months.june': 'June',
      'calendar.months.july': 'July',
      'calendar.months.august': 'August',
      'calendar.months.september': 'September',
      'calendar.months.october': 'October',
      'calendar.months.november': 'November',
      'calendar.months.december': 'December',
      'calendar.weekdays.sunday': 'Sunday',
      'calendar.weekdays.monday': 'Monday',
      'calendar.weekdays.tuesday': 'Tuesday',
      'calendar.weekdays.wednesday': 'Wednesday',
      'calendar.weekdays.thursday': 'Thursday',
      'calendar.weekdays.friday': 'Friday',
      'calendar.weekdays.saturday': 'Saturday',
      'calendar.today': 'Today',
      'calendar.yesterday': 'Yesterday',
      'calendar.tomorrow': 'Tomorrow',
      'calendar.timeSlots.morning': 'Morning',
      'calendar.timeSlots.afternoon': 'Afternoon',
      'calendar.timeSlots.evening': 'Evening',
      'calendar.timeSlots.night': 'Night',
      'calendar.actions.createPost': 'Create Post',
      'calendar.actions.editPost': 'Edit Post',
      'calendar.actions.deletePost': 'Delete Post',
      'calendar.actions.movePost': 'Move Post',
      'calendar.actions.copyPost': 'Copy Post',
      'calendar.status.draft': 'Draft',
      'calendar.status.scheduled': 'Scheduled',
      'calendar.status.published': 'Published',
      'calendar.status.failed': 'Failed',
    },
    ar: {
      // Arabic translations
      'editor.placeholder': 'اكتب محتوى منشورك هنا...',
      'editor.toolbar.bold': 'عريض',
      'editor.toolbar.italic': 'مائل',
      'editor.toolbar.underline': 'تحت خط',
      'editor.toolbar.link': 'إضافة رابط',
      'editor.toolbar.hashtag': 'إضافة هاشتاج',
      'editor.toolbar.emoji': 'إضافة رمز تعبيري',
      'editor.toolbar.characterCount': 'أحرف',
      'editor.toolbar.wordCount': 'كلمات',
      'editor.validation.required': 'هذا الحقل مطلوب',
      'editor.validation.minLength': 'الحد الأدنى {min} حرف مطلوب',
      'editor.validation.maxLength': 'الحد الأقصى {max} حرف مسموح',
      'editor.validation.invalidFormat': 'تنسيق غير صحيح',
      'editor.actions.save': 'حفظ',
      'editor.actions.cancel': 'إلغاء',
      'editor.actions.publish': 'نشر',
      'editor.actions.schedule': 'جدولة',
      'editor.actions.preview': 'معاينة',

      // Calendar Arabic translations
      'calendar.months.january': 'يناير',
      'calendar.months.february': 'فبراير',
      'calendar.months.march': 'مارس',
      'calendar.months.april': 'أبريل',
      'calendar.months.may': 'مايو',
      'calendar.months.june': 'يونيو',
      'calendar.months.july': 'يوليو',
      'calendar.months.august': 'أغسطس',
      'calendar.months.september': 'سبتمبر',
      'calendar.months.october': 'أكتوبر',
      'calendar.months.november': 'نوفمبر',
      'calendar.months.december': 'ديسمبر',
      'calendar.weekdays.sunday': 'الأحد',
      'calendar.weekdays.monday': 'الاثنين',
      'calendar.weekdays.tuesday': 'الثلاثاء',
      'calendar.weekdays.wednesday': 'الأربعاء',
      'calendar.weekdays.thursday': 'الخميس',
      'calendar.weekdays.friday': 'الجمعة',
      'calendar.weekdays.saturday': 'السبت',
      'calendar.today': 'اليوم',
      'calendar.yesterday': 'أمس',
      'calendar.tomorrow': 'غداً',
      'calendar.timeSlots.morning': 'صباحاً',
      'calendar.timeSlots.afternoon': 'ظهراً',
      'calendar.timeSlots.evening': 'مساءً',
      'calendar.timeSlots.night': 'ليلاً',
      'calendar.actions.createPost': 'إنشاء منشور',
      'calendar.actions.editPost': 'تعديل المنشور',
      'calendar.actions.deletePost': 'حذف المنشور',
      'calendar.actions.movePost': 'نقل المنشور',
      'calendar.actions.copyPost': 'نسخ المنشور',
      'calendar.status.draft': 'مسودة',
      'calendar.status.scheduled': 'مجدول',
      'calendar.status.published': 'منشور',
      'calendar.status.failed': 'فشل',
    },
    he: {
      // Hebrew translations
      'editor.placeholder': 'כתוב את תוכן הפוסט שלך כאן...',
      'editor.toolbar.bold': 'מודגש',
      'editor.toolbar.italic': 'נטוי',
      'editor.toolbar.underline': 'קו תחתון',
      'editor.toolbar.link': 'הוסף קישור',
      'editor.toolbar.hashtag': 'הוסף האשטאג',
      'editor.toolbar.emoji': 'הוסף אמוג\'י',
      'editor.toolbar.characterCount': 'תווים',
      'editor.toolbar.wordCount': 'מילים',
      'editor.validation.required': 'שדה זה נדרש',
      'editor.validation.minLength': 'נדרשים לפחות {min} תווים',
      'editor.validation.maxLength': 'מותר עד {max} תווים',
      'editor.validation.invalidFormat': 'פורמט לא תקין',
      'editor.actions.save': 'שמור',
      'editor.actions.cancel': 'בטל',
      'editor.actions.publish': 'פרסם',
      'editor.actions.schedule': 'תזמן',
      'editor.actions.preview': 'תצוגה מקדימה',

      // Calendar Hebrew translations
      'calendar.months.january': 'ינואר',
      'calendar.months.february': 'פברואר',
      'calendar.months.march': 'מרץ',
      'calendar.months.april': 'אפריל',
      'calendar.months.may': 'מאי',
      'calendar.months.june': 'יוני',
      'calendar.months.july': 'יולי',
      'calendar.months.august': 'אוגוסט',
      'calendar.months.september': 'ספטמבר',
      'calendar.months.october': 'אוקטובר',
      'calendar.months.november': 'נובמבר',
      'calendar.months.december': 'דצמבר',
      'calendar.weekdays.sunday': 'ראשון',
      'calendar.weekdays.monday': 'שני',
      'calendar.weekdays.tuesday': 'שלישי',
      'calendar.weekdays.wednesday': 'רביעי',
      'calendar.weekdays.thursday': 'חמישי',
      'calendar.weekdays.friday': 'שישי',
      'calendar.weekdays.saturday': 'שבת',
      'calendar.today': 'היום',
      'calendar.yesterday': 'אתמול',
      'calendar.tomorrow': 'מחר',
      'calendar.timeSlots.morning': 'בוקר',
      'calendar.timeSlots.afternoon': 'צהריים',
      'calendar.timeSlots.evening': 'ערב',
      'calendar.timeSlots.night': 'לילה',
      'calendar.actions.createPost': 'צור פוסט',
      'calendar.actions.editPost': 'ערוך פוסט',
      'calendar.actions.deletePost': 'מחק פוסט',
      'calendar.actions.movePost': 'העבר פוסט',
      'calendar.actions.copyPost': 'העתק פוסט',
      'calendar.status.draft': 'טיוטה',
      'calendar.status.scheduled': 'מתוזמן',
      'calendar.status.published': 'פורסם',
      'calendar.status.failed': 'נכשל',
    },
  };

  constructor() {
    // Initialize with default locale (English)
    this.setLocale('en');
  }

  setLocale(locale: string): LocalizationResult {
    const localeConfig = this.supportedLocales.find(l => l.code === locale);
    if (!localeConfig) {
      this.logger.warn(`Locale ${locale} not supported, falling back to English`);
      localeConfig = this.supportedLocales[0];
    }

    // Create intl instance
    this.currentIntl = createIntl(
      {
        locale: localeConfig.code,
        messages: this.messages[localeConfig.code] || this.messages.en,
        defaultLocale: 'en',
      },
      this.intlCache
    );

    const isRTL = localeConfig.direction === 'rtl';

    return {
      locale: localeConfig.code,
      direction: localeConfig.direction,
      messages: this.messages[localeConfig.code] || this.messages.en,
      dateFormat: localeConfig.dateFormat,
      timeFormat: localeConfig.timeFormat,
      currency: localeConfig.currency,
      numberFormat: localeConfig.numberFormat,
      isRTL,
      textAlignment: isRTL ? 'right' : 'left',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
    };
  }

  getSupportedLocales(): LocaleConfig[] {
    return this.supportedLocales;
  }

  getCurrentLocale(): string {
    return this.currentIntl.locale;
  }

  isRTL(): boolean {
    const localeConfig = this.supportedLocales.find(l => l.code === this.currentIntl.locale);
    return localeConfig?.direction === 'rtl';
  }

  formatMessage(key: string, values?: Record<string, any>): string {
    try {
      return this.currentIntl.formatMessage({ id: key }, values);
    } catch (error) {
      this.logger.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return this.currentIntl.formatDate(date, options);
  }

  formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return this.currentIntl.formatTime(date, options);
  }

  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return this.currentIntl.formatNumber(number, options);
  }

  formatCurrency(amount: number, currency?: string): string {
    const localeConfig = this.supportedLocales.find(l => l.code === this.currentIntl.locale);
    const currencyCode = currency || localeConfig?.currency || 'USD';
    
    return this.currentIntl.formatNumber(amount, {
      style: 'currency',
      currency: currencyCode,
    });
  }

  getEditorLocalization(): EditorLocalization {
    return {
      placeholder: this.formatMessage('editor.placeholder'),
      toolbar: {
        bold: this.formatMessage('editor.toolbar.bold'),
        italic: this.formatMessage('editor.toolbar.italic'),
        underline: this.formatMessage('editor.toolbar.underline'),
        link: this.formatMessage('editor.toolbar.link'),
        hashtag: this.formatMessage('editor.toolbar.hashtag'),
        emoji: this.formatMessage('editor.toolbar.emoji'),
        characterCount: this.formatMessage('editor.toolbar.characterCount'),
        wordCount: this.formatMessage('editor.toolbar.wordCount'),
      },
      validation: {
        required: this.formatMessage('editor.validation.required'),
        minLength: this.formatMessage('editor.validation.minLength'),
        maxLength: this.formatMessage('editor.validation.maxLength'),
        invalidFormat: this.formatMessage('editor.validation.invalidFormat'),
      },
      actions: {
        save: this.formatMessage('editor.actions.save'),
        cancel: this.formatMessage('editor.actions.cancel'),
        publish: this.formatMessage('editor.actions.publish'),
        schedule: this.formatMessage('editor.actions.schedule'),
        preview: this.formatMessage('editor.actions.preview'),
      },
    };
  }

  getCalendarLocalization(): CalendarLocalization {
    const months = [
      'calendar.months.january', 'calendar.months.february', 'calendar.months.march',
      'calendar.months.april', 'calendar.months.may', 'calendar.months.june',
      'calendar.months.july', 'calendar.months.august', 'calendar.months.september',
      'calendar.months.october', 'calendar.months.november', 'calendar.months.december',
    ];

    const weekdays = [
      'calendar.weekdays.sunday', 'calendar.weekdays.monday', 'calendar.weekdays.tuesday',
      'calendar.weekdays.wednesday', 'calendar.weekdays.thursday', 'calendar.weekdays.friday',
      'calendar.weekdays.saturday',
    ];

    return {
      months: months.map(key => this.formatMessage(key)),
      weekdays: weekdays.map(key => this.formatMessage(key)),
      weekdaysShort: weekdays.map(key => this.formatMessage(key).substring(0, 3)),
      today: this.formatMessage('calendar.today'),
      yesterday: this.formatMessage('calendar.yesterday'),
      tomorrow: this.formatMessage('calendar.tomorrow'),
      timeSlots: {
        morning: this.formatMessage('calendar.timeSlots.morning'),
        afternoon: this.formatMessage('calendar.timeSlots.afternoon'),
        evening: this.formatMessage('calendar.timeSlots.evening'),
        night: this.formatMessage('calendar.timeSlots.night'),
      },
      actions: {
        createPost: this.formatMessage('calendar.actions.createPost'),
        editPost: this.formatMessage('calendar.actions.editPost'),
        deletePost: this.formatMessage('calendar.actions.deletePost'),
        movePost: this.formatMessage('calendar.actions.movePost'),
        copyPost: this.formatMessage('calendar.actions.copyPost'),
      },
      status: {
        draft: this.formatMessage('calendar.status.draft'),
        scheduled: this.formatMessage('calendar.status.scheduled'),
        published: this.formatMessage('calendar.status.published'),
        failed: this.formatMessage('calendar.status.failed'),
      },
    };
  }

  getRTLStyles(): Record<string, any> {
    const isRTL = this.isRTL();
    
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      marginLeft: isRTL ? '0' : 'auto',
      marginRight: isRTL ? 'auto' : '0',
      paddingLeft: isRTL ? '0' : '1rem',
      paddingRight: isRTL ? '1rem' : '0',
      borderLeft: isRTL ? 'none' : '1px solid #e5e7eb',
      borderRight: isRTL ? '1px solid #e5e7eb' : 'none',
    };
  }

  getEditorRTLConfig(): Record<string, any> {
    const isRTL = this.isRTL();
    
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      placeholder: this.formatMessage('editor.placeholder'),
      toolbarPosition: isRTL ? 'bottom' : 'top',
      toolbarAlignment: isRTL ? 'right' : 'left',
      characterCountPosition: isRTL ? 'left' : 'right',
      wordCountPosition: isRTL ? 'left' : 'right',
    };
  }

  getCalendarRTLConfig(): Record<string, any> {
    const isRTL = this.isRTL();
    
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      weekStart: isRTL ? 6 : 0, // Sunday = 0, Saturday = 6
      headerAlignment: isRTL ? 'right' : 'left',
      cellAlignment: isRTL ? 'right' : 'left',
      navigationButtons: isRTL ? 'right' : 'left',
      timeSlotAlignment: isRTL ? 'right' : 'left',
    };
  }

  addTranslation(locale: string, key: string, value: string): void {
    if (!this.messages[locale]) {
      this.messages[locale] = {};
    }
    this.messages[locale][key] = value;
  }

  removeTranslation(locale: string, key: string): void {
    if (this.messages[locale]) {
      delete this.messages[locale][key];
    }
  }

  getMissingTranslations(locale: string): string[] {
    const baseMessages = this.messages.en;
    const localeMessages = this.messages[locale] || {};
    
    return Object.keys(baseMessages).filter(key => !localeMessages[key]);
  }

  exportTranslations(locale: string): Record<string, string> {
    return this.messages[locale] || {};
  }

  importTranslations(locale: string, translations: Record<string, string>): void {
    this.messages[locale] = { ...this.messages[locale], ...translations };
  }
}
