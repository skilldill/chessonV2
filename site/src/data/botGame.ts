import { FRIEND_GAME_TRANSLATIONS } from './friendGame';

export const BOT_GAME_CANONICAL = 'https://chesson.me/ru/play-chess-with-bot/';
export const BOT_GAME_EN_CANONICAL = 'https://chesson.me/play-chess-with-bot/';
export const BOT_GAME_RU_SLUGS = [
  'shahmaty_online_s_botom',
  'igrat_v_shahmaty_s_botom',
  'shahmaty_s_kompyuterom',
  'igrat_v_shahmaty_s_kompyuterom_online',
  'shahmaty_s_botom_bez_registratsii',
] as const;
export const BOT_GAME_EN_SLUGS = [
  'play_chess_with_a_bot',
  'chess_online_with_a_bot',
  'play_chess_against_computer',
  'chess_vs_computer',
  'chess_with_a_bot_no_signup',
] as const;
export const BOT_GAME_DIFFICULTIES = ['super_easy', 'easy', 'medium', 'hard'] as const;

export const BOT_GAME_TRANSLATIONS = {
  ru: {
    ...FRIEND_GAME_TRANSLATIONS.ru,
    canonical: BOT_GAME_CANONICAL,
    title: 'Играть в шахматы с ботом онлайн бесплатно | Chesson',
    description: 'Играйте в шахматы с ботом онлайн бесплатно и без регистрации. Выберите сложность, цвет фигур и время партии. Игра с компьютером на телефоне и ПК.',
    heading: ['Шахматы онлайн', 'с ботом'],
    summary: 'Выберите сложность и начните партию с компьютером.',
    howTitle: 'От настроек к партии с ботом',
    steps: [
      { title: 'Настройте партию', description: 'Выберите сложность бота, цвет фигур и время каждому игроку.' },
      { title: 'Начните игру', description: 'Кнопка создаст комнату и сразу откроет вашу партию с ботом.' },
      { title: 'Играйте и тренируйтесь', description: 'Соперник уже в комнате. Если вы играете чёрными, бот сделает первый ход.' },
    ],
    faqTitle: 'Вопросы об игре с ботом',
    faq: [
      { question: 'Можно ли играть в шахматы с ботом бесплатно и без регистрации?', answer: 'Да. Выберите настройки и начните игру прямо в браузере, без аккаунта и установки приложения.' },
      { question: 'Как выбрать сложность бота?', answer: 'Доступны четыре уровня: очень легко, легко, средне и сложно. Выберите уровень перед началом партии.' },
      { question: 'Можно ли играть против компьютера чёрными фигурами?', answer: 'Да. Выберите чёрные фигуры в настройках. Бот будет играть белыми и сделает первый ход.' },
      { question: 'Можно ли играть с ботом на телефоне?', answer: 'Да. Кнопка откроет мобильную версию игры на телефоне и обычную версию на компьютере.' },
      { question: 'Нужно ли ждать подключения соперника?', answer: 'Нет. Бот подключается автоматически, и партия начинается после вашего входа в созданную комнату.' },
    ],
    backToSettings: 'Настроить игру с ботом',
    settings: {
      ...FRIEND_GAME_TRANSLATIONS.ru.settings,
      legend: 'Настройки партии',
      submit: 'Играть с ботом',
      difficulty: 'Сложность бота',
      difficultyLabels: ['Очень легко', 'Легко', 'Средне', 'Сложно'],
      color: 'Ваши фигуры',
      white: 'Белые',
      black: 'Чёрные',
    },
  },
  en: {
    ...FRIEND_GAME_TRANSLATIONS.en,
    canonical: BOT_GAME_EN_CANONICAL,
    title: 'Play Chess Against a Bot Online for Free | Chesson',
    description: 'Play chess against a computer online for free, no sign-up required. Choose the bot difficulty, your color and time control. Play on desktop or mobile.',
    heading: ['Play chess online', 'against a bot'],
    summary: 'Choose a difficulty and start a game against the computer.',
    howTitle: 'From setup to a game against the bot',
    steps: [
      { title: 'Set up your game', description: 'Choose the bot difficulty, your piece color and the time per player.' },
      { title: 'Start playing', description: 'The button creates a room and opens your game against the bot.' },
      { title: 'Play and practice', description: 'Your opponent is already there. If you play as Black, the bot makes the first move.' },
    ],
    faqTitle: 'Playing chess against a bot',
    faq: [
      { question: 'Can I play against a chess bot for free without signing up?', answer: 'Yes. Choose your settings and start playing in your browser, with no account or installation required.' },
      { question: 'How do I choose the bot difficulty?', answer: 'Four levels are available: Super Easy, Easy, Medium and Hard. Pick a level before starting your game.' },
      { question: 'Can I play as Black against the computer?', answer: 'Yes. Choose Black in the settings. The bot plays as White and makes the first move.' },
      { question: 'Can I play chess against a bot on my phone?', answer: 'Yes. The button opens the mobile game on your phone and the desktop game on your computer.' },
      { question: 'Do I need to wait for an opponent to join?', answer: 'No. The bot joins automatically, and the game starts after you enter your new room.' },
    ],
    backToSettings: 'Set up a bot game',
    settings: {
      ...FRIEND_GAME_TRANSLATIONS.en.settings,
      legend: 'Game settings',
      submit: 'Play against a bot',
      difficulty: 'Bot difficulty',
      difficultyLabels: ['Super Easy', 'Easy', 'Medium', 'Hard'],
      color: 'Your pieces',
      white: 'White',
      black: 'Black',
    },
  },
} as const;
