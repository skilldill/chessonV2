import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'ru' | 'en'

const STORAGE_KEY = 'chess-swiss-tournament-lang-v1'

const translations: Record<Language, Record<string, string>> = {
  ru: {
    'header.title': 'Швейцарский турнир',
    'header.subtitle':
      'Формирование групп, управление турами и итоговая таблица победителей.',
    'header.newTournament': 'Новый турнир',
    'header.toggleLanguage': 'EN',
    'header.toggleThemeToLight': 'Светлая',
    'header.toggleThemeToDark': 'Темная',
    'tabs.navLabel': 'Разделы',
    'tabs.create': 'Группы',
    'tabs.participants': 'Участники',
    'tabs.rounds': 'Туры и результаты',
    'footer.note':
      'Состояние турнира сохраняется автоматически и восстанавливается после перезагрузки страницы.',
    'confirm.cancel': 'Отмена',
    'confirm.default': 'Подтвердить',
    'screen.startFirstRound': 'Запустить турнир и сформировать 1-й тур',
    'screen.finishTitle': 'Завершить турнир?',
    'screen.finishDescription': 'После завершения нельзя будет сформировать новые туры.',
    'screen.finishConfirm': 'Завершить',
    'screen.tieBreakTitle': 'Сформировать тай-брейк?',
    'screen.tieBreakDescription':
      'В турнире есть несколько игроков с одинаковыми очками и коэффициентом Бухгольца на границе призовых мест. Сформировать тай-брейк?',
    'screen.tieBreakAction': 'Сформировать тай-брейк',
    'screen.finishAnyway': 'Завершить турнир',
    'create.newTournament': 'Создать турнир',
    'create.tournamentName': 'Название турнира',
    'create.tournamentNamePlaceholder': 'Например, Кубок организаций',
    'create.createButton': 'Создать',
    'create.status': 'Статус:',
    'create.addGroup': 'Добавить группу',
    'create.groupPlaceholder': 'Например, Организация А',
    'create.addButton': 'Добавить',
    'create.groupsTitle': 'Группы участников',
    'create.noGroups': 'Пока нет групп. Добавьте минимум одну.',
    'create.delete': 'Удалить',
    'participants.title': 'Участники',
    'participants.hint':
      'После запуска турнира можно добавлять участников только между турами, до формирования следующего тура.',
    'participants.name': 'Имя участника',
    'participants.namePlaceholder': 'ФИО',
    'participants.group': 'Группа',
    'participants.add': 'Добавить участника',
    'participants.empty': 'Участники еще не добавлены.',
    'participants.actions': 'Действия',
    'participants.removed': 'выбыл',
    'table.rank': 'Место',
    'table.participant': 'Участник',
    'table.group': 'Группа',
    'table.points': 'Очки',
    'table.buchholz': 'Бухгольц',
    'table.wins': 'Победы',
    'rounds.title': 'Туры и результаты',
    'rounds.tournament': 'Турнир:',
    'rounds.status': 'Статус:',
    'rounds.completedRounds': 'Завершено туров:',
    'rounds.currentRound': 'Текущий тур: {number}',
    'rounds.currentTieBreak': 'Тай-брейк: тур {number}',
    'rounds.pair': 'Пара {number}',
    'rounds.result': 'Результат',
    'rounds.select': 'Выберите',
    'rounds.winA': 'Победил {name}',
    'rounds.winB': 'Победил {name}',
    'rounds.draw': 'Ничья',
    'rounds.byeAuto': 'Автоматическая победа (bye): 1 очко',
    'rounds.finishCurrentRound': 'Завершить текущий тур',
    'rounds.createNextRound': 'Сформировать следующий тур',
    'rounds.finishTournament': 'Завершить турнир',
    'rounds.finishedBanner': 'Турнир завершен. Таблица победителей сформирована ниже.',
    'rounds.table': 'Таблица',
    'rounds.noTableData': 'Нет данных для таблицы.',
    'rounds.history': 'История туров',
    'rounds.roundHistory': 'Тур {number} ({status})',
    'rounds.tieBreakLabel': 'Тай-брейк',
    'rounds.awaiting': 'Ожидается',
    'rounds.byePoint': 'BYE: 1 очко',
    'rounds.startHint': 'Запустите турнир на вкладке «Создание турнира».',
    'status.setup': 'Подготовка',
    'status.running': 'Идет',
    'status.finished': 'Завершен',
    'status.active': 'Активен',
    'status.completed': 'Завершен',
    'common.unknown': 'Неизвестный',
    'common.noTeam': 'Без команды',
  },
  en: {
    'header.title': 'Swiss Tournament',
    'header.subtitle':
      'Create teams, manage rounds, and track the final winners table.',
    'header.newTournament': 'New tournament',
    'header.toggleLanguage': 'RU',
    'header.toggleThemeToLight': 'Light',
    'header.toggleThemeToDark': 'Dark',
    'tabs.navLabel': 'Sections',
    'tabs.create': 'Groups',
    'tabs.participants': 'Participants',
    'tabs.rounds': 'Rounds & results',
    'footer.note':
      'Tournament state is saved automatically and restored after page reload.',
    'confirm.cancel': 'Cancel',
    'confirm.default': 'Confirm',
    'screen.startFirstRound': 'Start tournament and generate Round 1',
    'screen.finishTitle': 'Finish tournament?',
    'screen.finishDescription':
      'After finishing, you will not be able to generate new rounds.',
    'screen.finishConfirm': 'Finish',
    'screen.tieBreakTitle': 'Generate tie-break?',
    'screen.tieBreakDescription':
      'There are multiple players with equal points and Buchholz on the prize boundary. Generate tie-break matches?',
    'screen.tieBreakAction': 'Generate tie-break',
    'screen.finishAnyway': 'Finish tournament',
    'create.newTournament': 'Create tournament',
    'create.tournamentName': 'Tournament name',
    'create.tournamentNamePlaceholder': 'For example, Organizations Cup',
    'create.createButton': 'Create',
    'create.status': 'Status:',
    'create.addGroup': 'Add group',
    'create.groupPlaceholder': 'For example, Organization A',
    'create.addButton': 'Add',
    'create.groupsTitle': 'Participant groups',
    'create.noGroups': 'No groups yet. Add at least one.',
    'create.delete': 'Delete',
    'participants.title': 'Participants',
    'participants.hint':
      'After tournament start, participants can be added only between rounds before the next round is generated.',
    'participants.name': 'Participant name',
    'participants.namePlaceholder': 'Full name',
    'participants.group': 'Group',
    'participants.add': 'Add participant',
    'participants.empty': 'No participants yet.',
    'participants.actions': 'Actions',
    'participants.removed': 'removed',
    'table.rank': 'Rank',
    'table.participant': 'Participant',
    'table.group': 'Group',
    'table.points': 'Points',
    'table.buchholz': 'Buchholz',
    'table.wins': 'Wins',
    'rounds.title': 'Rounds & results',
    'rounds.tournament': 'Tournament:',
    'rounds.status': 'Status:',
    'rounds.completedRounds': 'Completed rounds:',
    'rounds.currentRound': 'Current round: {number}',
    'rounds.currentTieBreak': 'Tie-break: round {number}',
    'rounds.pair': 'Pair {number}',
    'rounds.result': 'Result',
    'rounds.select': 'Select',
    'rounds.winA': '{name} won',
    'rounds.winB': '{name} won',
    'rounds.draw': 'Draw',
    'rounds.byeAuto': 'Automatic win (bye): 1 point',
    'rounds.finishCurrentRound': 'Finish current round',
    'rounds.createNextRound': 'Generate next round',
    'rounds.finishTournament': 'Finish tournament',
    'rounds.finishedBanner': 'Tournament is finished. Winners table is shown below.',
    'rounds.table': 'Table',
    'rounds.noTableData': 'No table data yet.',
    'rounds.history': 'Round history',
    'rounds.roundHistory': 'Round {number} ({status})',
    'rounds.tieBreakLabel': 'Tie-break',
    'rounds.awaiting': 'Pending',
    'rounds.byePoint': 'BYE: 1 point',
    'rounds.startHint': 'Start tournament in the "Tournament setup" tab.',
    'status.setup': 'Setup',
    'status.running': 'Running',
    'status.finished': 'Finished',
    'status.active': 'Active',
    'status.completed': 'Completed',
    'common.unknown': 'Unknown',
    'common.noTeam': 'No team',
  },
}

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: string, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

type I18nProviderProps = {
  children: ReactNode
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' ? 'en' : 'ru'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'ru' ? 'en' : 'ru'))
  }, [])

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const template = translations[language][key] ?? key
      if (!values) {
        return template
      }

      return Object.entries(values).reduce((text, [name, value]) => {
        return text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
      }, template)
    },
    [language],
  )

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t],
  )

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}
