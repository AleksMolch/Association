/**
 * ads-service.ts — интерфейс рекламного адаптера.
 *
 * В MVP реальный Yandex Mobile Ads SDK не подключён: нужен нативный модуль,
 * ключи и тестовые устройства. Интерфейс отделён, чтобы позже заменить
 * NoopAdsService на YandexAdsService без изменения экранов.
 */

export type AdPlacement = 'today' | 'words' | 'progress' | 'settings';

export type AdResult = 'shown' | 'no-fill' | 'error' | 'not-configured';

export interface AdsService {
  init(): Promise<void>;
  showBanner(placement: AdPlacement): Promise<AdResult>;
}

export class NoopAdsService implements AdsService {
  async init(): Promise<void> {
    // намеренно пусто: реклама не инициализируется в MVP
  }

  async showBanner(): Promise<AdResult> {
    return 'not-configured';
  }
}

export const adsService: AdsService = new NoopAdsService();
