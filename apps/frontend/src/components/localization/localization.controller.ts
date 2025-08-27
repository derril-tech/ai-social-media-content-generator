import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { LocalizationService, LocalizationResult, EditorLocalization, CalendarLocalization } from './localization.service';

export class SetLocaleDto {
  locale: string;
}

export class AddTranslationDto {
  locale: string;
  key: string;
  value: string;
}

export class ImportTranslationsDto {
  locale: string;
  translations: Record<string, string>;
}

@ApiTags('Localization')
@Controller('localization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('supported-locales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get supported locales',
    description: 'Returns all supported locales with their configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Supported locales retrieved successfully',
  })
  async getSupportedLocales() {
    return this.localizationService.getSupportedLocales();
  }

  @Get('current-locale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current locale',
    description: 'Returns the currently active locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current locale retrieved successfully',
  })
  async getCurrentLocale() {
    return {
      locale: this.localizationService.getCurrentLocale(),
      isRTL: this.localizationService.isRTL(),
    };
  }

  @Post('set-locale')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Set locale',
    description: 'Sets the active locale for the application.',
  })
  @ApiBody({ type: SetLocaleDto })
  @ApiResponse({
    status: 200,
    description: 'Locale set successfully',
  })
  async setLocale(@Body() dto: SetLocaleDto): Promise<LocalizationResult> {
    return this.localizationService.setLocale(dto.locale);
  }

  @Get('editor-localization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get editor localization',
    description: 'Returns localized strings for the editor component.',
  })
  @ApiResponse({
    status: 200,
    description: 'Editor localization retrieved successfully',
  })
  async getEditorLocalization(): Promise<EditorLocalization> {
    return this.localizationService.getEditorLocalization();
  }

  @Get('calendar-localization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get calendar localization',
    description: 'Returns localized strings for the calendar component.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar localization retrieved successfully',
  })
  async getCalendarLocalization(): Promise<CalendarLocalization> {
    return this.localizationService.getCalendarLocalization();
  }

  @Get('rtl-styles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get RTL styles',
    description: 'Returns CSS styles for RTL (right-to-left) layout support.',
  })
  @ApiResponse({
    status: 200,
    description: 'RTL styles retrieved successfully',
  })
  async getRTLStyles() {
    return this.localizationService.getRTLStyles();
  }

  @Get('editor-rtl-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get editor RTL configuration',
    description: 'Returns RTL configuration for the editor component.',
  })
  @ApiResponse({
    status: 200,
    description: 'Editor RTL configuration retrieved successfully',
  })
  async getEditorRTLConfig() {
    return this.localizationService.getEditorRTLConfig();
  }

  @Get('calendar-rtl-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get calendar RTL configuration',
    description: 'Returns RTL configuration for the calendar component.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar RTL configuration retrieved successfully',
  })
  async getCalendarRTLConfig() {
    return this.localizationService.getCalendarRTLConfig();
  }

  @Post('add-translation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add translation',
    description: 'Adds a new translation key-value pair for a specific locale.',
  })
  @ApiBody({ type: AddTranslationDto })
  @ApiResponse({
    status: 200,
    description: 'Translation added successfully',
  })
  async addTranslation(@Body() dto: AddTranslationDto) {
    this.localizationService.addTranslation(dto.locale, dto.key, dto.value);
    return { message: 'Translation added successfully' };
  }

  @Put('remove-translation/:locale/:key')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove translation',
    description: 'Removes a translation key for a specific locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Translation removed successfully',
  })
  async removeTranslation(
    @Param('locale') locale: string,
    @Param('key') key: string,
  ) {
    this.localizationService.removeTranslation(locale, key);
    return { message: 'Translation removed successfully' };
  }

  @Get('missing-translations/:locale')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get missing translations',
    description: 'Returns missing translation keys for a specific locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Missing translations retrieved successfully',
  })
  async getMissingTranslations(@Param('locale') locale: string) {
    const missingKeys = this.localizationService.getMissingTranslations(locale);
    return {
      locale,
      missingKeys,
      count: missingKeys.length,
    };
  }

  @Get('export-translations/:locale')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Export translations',
    description: 'Exports all translations for a specific locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Translations exported successfully',
  })
  async exportTranslations(@Param('locale') locale: string) {
    const translations = this.localizationService.exportTranslations(locale);
    return {
      locale,
      translations,
      count: Object.keys(translations).length,
    };
  }

  @Post('import-translations')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Import translations',
    description: 'Imports translations for a specific locale.',
  })
  @ApiBody({ type: ImportTranslationsDto })
  @ApiResponse({
    status: 200,
    description: 'Translations imported successfully',
  })
  async importTranslations(@Body() dto: ImportTranslationsDto) {
    this.localizationService.importTranslations(dto.locale, dto.translations);
    return { message: 'Translations imported successfully' };
  }

  @Get('format-date/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Format date',
    description: 'Formats a date according to the current locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Date formatted successfully',
  })
  async formatDate(@Param('date') dateString: string) {
    const date = new Date(dateString);
    const formattedDate = this.localizationService.formatDate(date);
    return {
      originalDate: dateString,
      formattedDate,
      locale: this.localizationService.getCurrentLocale(),
    };
  }

  @Get('format-time/:time')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Format time',
    description: 'Formats a time according to the current locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Time formatted successfully',
  })
  async formatTime(@Param('time') timeString: string) {
    const date = new Date(`2000-01-01T${timeString}`);
    const formattedTime = this.localizationService.formatTime(date);
    return {
      originalTime: timeString,
      formattedTime,
      locale: this.localizationService.getCurrentLocale(),
    };
  }

  @Get('format-number/:number')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Format number',
    description: 'Formats a number according to the current locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Number formatted successfully',
  })
  async formatNumber(@Param('number') numberString: string) {
    const number = parseFloat(numberString);
    const formattedNumber = this.localizationService.formatNumber(number);
    return {
      originalNumber: numberString,
      formattedNumber,
      locale: this.localizationService.getCurrentLocale(),
    };
  }

  @Get('format-currency/:amount')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Format currency',
    description: 'Formats a currency amount according to the current locale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Currency formatted successfully',
  })
  async formatCurrency(@Param('amount') amountString: string) {
    const amount = parseFloat(amountString);
    const formattedCurrency = this.localizationService.formatCurrency(amount);
    return {
      originalAmount: amountString,
      formattedCurrency,
      locale: this.localizationService.getCurrentLocale(),
    };
  }

  @Get('rtl-support-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get RTL support status',
    description: 'Returns the current RTL support status and configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'RTL support status retrieved successfully',
  })
  async getRTLSupportStatus() {
    const isRTL = this.localizationService.isRTL();
    const currentLocale = this.localizationService.getCurrentLocale();
    const supportedLocales = this.localizationService.getSupportedLocales();
    const rtlLocales = supportedLocales.filter(locale => locale.direction === 'rtl');

    return {
      isRTL,
      currentLocale,
      rtlSupported: rtlLocales.length > 0,
      rtlLocales: rtlLocales.map(locale => ({
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
      })),
      totalRTLSupported: rtlLocales.length,
      totalLocales: supportedLocales.length,
    };
  }
}
