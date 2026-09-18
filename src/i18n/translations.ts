import type {
  RiskFactorCode,
  RiskLevel,
} from '../types/portal'
import type {
  ActionReasonCode,
  PortalAction,
} from '../domain/validation/validateAction'

export type Language = 'en' | 'ru'

const translations = {
  en: {
    open: 'OPEN',
    critical: 'CRITICAL',
    attention: 'ATTENTION',
    closed: 'CLOSED',
    eventLog: 'EVENT LOG',
    system: 'SYSTEM',
    move: 'MOVE',
    interact: 'INTERACT',
    clickInspect: 'CLICK INSPECT',
    inspect: 'INSPECT',
    openTerminal: 'OPEN',
    noActivePortals: 'NO ACTIVE PORTALS',
    noActivePortalsHint: 'The laboratory is clear. Open SYSTEM to restore demo data.',
    resetLab: 'RESET LAB',
    riftIdentification: 'RIFT IDENTIFICATION',
    energy: 'ENERGY',
    stability: 'STABILITY',
    collapse: 'COLLAPSE',
    creatures: 'CREATURES',
    riskAssessment: 'RISK ASSESSMENT',
    noRiskFactors: 'No active risk factors detected.',
    unknownTelemetry: 'UNKNOWN TELEMETRY DETECTED - STATE MARKED UNCERTAIN',
    actionRejected: 'ACTION REJECTED',
    actionCompleted: 'ACTION COMPLETED',
    observerTelemetry: 'Observer deployed successfully. Telemetry stream received.',
    warning: 'WARNING',
    cancel: 'CANCEL',
    forceClose: 'FORCE CLOSE',
    offline: 'OFFLINE',
    minutes: 'MIN',
    auditTrail: 'AUDIT TRAIL',
    noEvents: 'No events recorded yet.',
    clearLog: 'CLEAR LOG',
    statusSuccess: 'SUCCESS',
    statusRejected: 'REJECTED',
    riskBeforeAfter: 'Risk',
    currentStatus: 'CURRENT STATUS',
    totalPortals: 'TOTAL PORTALS',
    averageRisk: 'AVERAGE RISK',
    actionsRecorded: 'ACTIONS RECORDED',
    rejectedActions: 'REJECTED ACTIONS',
    actionBreakdown: 'ACTION BREAKDOWN',
    qaScenarios: 'QA SCENARIOS',
    emptyLabScenario: 'LOAD EMPTY-LAB SCENARIO',
    restoreDemo: 'RESTORE DEMO LAB',
    emptyLabDescription:
      'Removes all portals so the empty-state requirement can be checked. Event history is preserved.',
    restoreDemoDescription:
      'Restores the original six demo portals and clears the current portal state.',
    closePanel: 'Close panel',
    language: 'LANGUAGE',
    terminalEventLog: 'EVENT LOG',
    terminalSystem: 'SYSTEM REPORT',
  },
  ru: {
    open: 'ОТКРЫТО',
    critical: 'КРИТИЧ.',
    attention: 'ВНИМАНИЕ',
    closed: 'ЗАКРЫТО',
    eventLog: 'ЖУРНАЛ',
    system: 'СИСТЕМА',
    move: 'ДВИЖЕНИЕ',
    interact: 'ДЕЙСТВИЕ',
    clickInspect: 'КЛИК - ОСМОТР',
    inspect: 'ОСМОТРЕТЬ',
    openTerminal: 'ОТКРЫТЬ',
    noActivePortals: 'АКТИВНЫХ ПОРТАЛОВ НЕТ',
    noActivePortalsHint: 'Лаборатория чиста. Открой СИСТЕМУ, чтобы вернуть демо-данные.',
    resetLab: 'СБРОСИТЬ ЛАБ.',
    riftIdentification: 'ИДЕНТИФИКАЦИЯ РАЗЛОМА',
    energy: 'ЭНЕРГИЯ',
    stability: 'СТАБИЛЬНОСТЬ',
    collapse: 'КОЛЛАПС',
    creatures: 'СУЩЕСТВА',
    riskAssessment: 'ОЦЕНКА РИСКА',
    noRiskFactors: 'Активные факторы риска не обнаружены.',
    unknownTelemetry: 'ОБНАРУЖЕНА НЕИЗВЕСТНАЯ ТЕЛЕМЕТРИЯ - СОСТОЯНИЕ НЕОПРЕДЕЛЕННО',
    actionRejected: 'ДЕЙСТВИЕ ОТКЛОНЕНО',
    actionCompleted: 'ДЕЙСТВИЕ ВЫПОЛНЕНО',
    observerTelemetry: 'Наблюдатель отправлен. Телеметрия получена.',
    warning: 'ПРЕДУПРЕЖДЕНИЕ',
    cancel: 'ОТМЕНА',
    forceClose: 'ЗАКРЫТЬ ПРИНУДИТЕЛЬНО',
    offline: 'ОТКЛЮЧЕН',
    minutes: 'МИН',
    auditTrail: 'ЖУРНАЛ СОБЫТИЙ',
    noEvents: 'Событий пока нет.',
    clearLog: 'ОЧИСТИТЬ ЖУРНАЛ',
    statusSuccess: 'УСПЕХ',
    statusRejected: 'ОТКЛОНЕНО',
    riskBeforeAfter: 'Риск',
    currentStatus: 'ТЕКУЩЕЕ СОСТОЯНИЕ',
    totalPortals: 'ВСЕГО ПОРТАЛОВ',
    averageRisk: 'СРЕДНИЙ РИСК',
    actionsRecorded: 'ДЕЙСТВИЙ В ЖУРНАЛЕ',
    rejectedActions: 'ОТКЛОНЕНО',
    actionBreakdown: 'ДЕЙСТВИЯ',
    qaScenarios: 'QA-СЦЕНАРИИ',
    emptyLabScenario: 'ЗАГРУЗИТЬ ПУСТУЮ ЛАБОРАТОРИЮ',
    restoreDemo: 'ВОССТАНОВИТЬ ДЕМО',
    emptyLabDescription:
      'Удаляет все порталы для проверки обязательного empty-state. История событий сохраняется.',
    restoreDemoDescription:
      'Возвращает исходные шесть демо-порталов и сбрасывает их текущее состояние.',
    closePanel: 'Закрыть панель',
    language: 'ЯЗЫК',
    terminalEventLog: 'ЖУРНАЛ СОБЫТИЙ',
    terminalSystem: 'ОТЧЕТ СИСТЕМЫ',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function t(
  language: Language,
  key: TranslationKey,
): string {
  return translations[language][key]
}

const riskLevelLabels: Record<
  Language,
  Record<RiskLevel, string>
> = {
  en: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  ru: {
    LOW: 'НИЗКИЙ',
    MEDIUM: 'СРЕДНИЙ',
    HIGH: 'ВЫСОКИЙ',
    CRITICAL: 'КРИТИЧЕСКИЙ',
  },
}

export function riskLevelLabel(
  language: Language,
  level: RiskLevel,
): string {
  return riskLevelLabels[language][level]
}

const riskFactorLabels: Record<
  Language,
  Record<RiskFactorCode, string>
> = {
  en: {
    criticallyLowStability: 'Critically low stability',
    lowStability: 'Low stability',
    reducedStability: 'Reduced stability',
    extremeEnergy: 'Extreme energy level',
    highEnergy: 'High energy level',
    elevatedEnergy: 'Elevated energy level',
    collapseImminent: 'Collapse is imminent',
    collapseApproaching: 'Collapse is approaching',
    limitedCollapseWindow: 'Limited collapse window',
    multipleCreatures: 'Multiple creatures detected',
    creaturesDetected: 'Creatures detected',
    uncertainState: 'Portal state is uncertain',
  },
  ru: {
    criticallyLowStability: 'Критически низкая стабильность',
    lowStability: 'Низкая стабильность',
    reducedStability: 'Сниженная стабильность',
    extremeEnergy: 'Экстремальный уровень энергии',
    highEnergy: 'Высокий уровень энергии',
    elevatedEnergy: 'Повышенный уровень энергии',
    collapseImminent: 'Коллапс неизбежен',
    collapseApproaching: 'Коллапс приближается',
    limitedCollapseWindow: 'Мало времени до коллапса',
    multipleCreatures: 'Обнаружено много существ',
    creaturesDetected: 'Обнаружены существа',
    uncertainState: 'Состояние портала неопределенно',
  },
}

export function riskFactorLabel(
  language: Language,
  code: RiskFactorCode,
): string {
  return riskFactorLabels[language][code]
}

const actionLabels: Record<
  Language,
  Record<PortalAction, string>
> = {
  en: {
    stabilize: 'STABILIZE',
    observe: 'SEND OBSERVER',
    'mark-uncertain': 'MARK UNCERTAIN',
    close: 'CLOSE PORTAL',
  },
  ru: {
    stabilize: 'СТАБИЛИЗИРОВАТЬ',
    observe: 'ОТПРАВИТЬ НАБЛЮДАТЕЛЯ',
    'mark-uncertain': 'ПОМЕТИТЬ НЕОПРЕДЕЛЕННЫМ',
    close: 'ЗАКРЫТЬ ПОРТАЛ',
  },
}

export function actionLabel(
  language: Language,
  action: PortalAction,
): string {
  return actionLabels[language][action]
}

export function actionReason(
  language: Language,
  code: ActionReasonCode,
  creatureCount = 0,
): string {
  const reasons: Record<
    Exclude<ActionReasonCode, 'creaturesInside'>,
    Record<Language, string>
  > = {
    alreadyClosed: {
      en: 'This portal is already closed.',
      ru: 'Этот портал уже закрыт.',
    },
    criticalObserver: {
      en: 'Observer deployment is forbidden while portal risk is CRITICAL.',
      ru: 'Нельзя отправить наблюдателя, пока риск портала КРИТИЧЕСКИЙ.',
    },
    alreadyStable: {
      en: 'This portal is already stable.',
      ru: 'Этот портал уже стабилен.',
    },
    alreadyUncertain: {
      en: 'This portal is already marked as uncertain.',
      ru: 'Этот портал уже помечен как неопределенный.',
    },
  }

  if (code === 'creaturesInside') {
    if (language === 'ru') {
      return `Внутри осталось существ: ${creatureCount}. Принудительное закрытие может запереть их навсегда.`
    }

    return `${creatureCount} creature(s) remain inside. Closing the portal may trap them permanently.`
  }

  return reasons[code][language]
}
