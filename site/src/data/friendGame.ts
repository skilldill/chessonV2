export const FRIEND_GAME_CANONICAL = 'https://chesson.me/ru/play-chess-with-friends-link/';
export const FRIEND_GAME_EN_CANONICAL = 'https://chesson.me/play-chess-with-friends-link/';
export type FriendGameLanguage = 'ru' | 'en';

export const FRIEND_GAME_SLUGS = [
  'shahmaty_online_s_drugom_po_ssylke',
  'shahmaty_online_s_drugom',
  'onlayn_shahmaty_po_ssylke_s_drugom',
  'shahmaty_s_drugom_onlayn',
  'shahmaty_s_drugom',
] as const;

export const FRIEND_GAME_MINUTES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
export const FRIEND_GAME_INCREMENTS = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

export const FRIEND_GAME_FAQ = [
  {
    question: 'Нужна ли регистрация для игры с другом?',
    answer: 'Нет. Вы и ваш друг можете играть без аккаунта, прямо в браузере.',
  },
  {
    question: 'Как отправить другу ссылку на партию?',
    answer: 'После создания комнаты скопируйте ссылку на игру и отправьте её другу в мессенджер. Он откроет ту же комнату.',
  },
  {
    question: 'Можно ли играть с телефона против друга на компьютере?',
    answer: 'Да. Вы можете использовать разные устройства. Ссылка на комнату откроет подходящую версию игры.',
  },
  {
    question: 'Что означает добавление секунд за ход?',
    answer: 'После каждого вашего хода к оставшемуся времени добавляется выбранное число секунд. Например, 3 + 2 — это три минуты каждому игроку и две секунды за каждый ход.',
  },
  {
    question: 'Можно ли играть с другом из другой страны?',
    answer: 'Да. Для подключения к одной комнате вам нужны интернет и браузер.',
  },
];

export const FRIEND_GAME_TRANSLATIONS = {
  ru: {
    canonical: FRIEND_GAME_CANONICAL,
    locale: 'ru_RU',
    homeHref: '/ru/',
    title: 'Играть в шахматы онлайн с другом по ссылке бесплатно | Chesson',
    description: 'Играйте в шахматы онлайн с другом по ссылке бесплатно и без регистрации. Выберите время партии и пригласите друга с телефона или компьютера.',
    heading: ['Шахматы онлайн', 'с другом по ссылке'],
    summary: 'Создайте партию и отправьте ссылку другу.',
    benefits: 'Бесплатно · Без регистрации',
    howTitle: 'Одна ссылка для вашей партии',
    steps: [
      { title: 'Выберите время', description: 'Задайте минуты каждому игроку и добавление секунд за ход.' },
      { title: 'Пригласите друга', description: 'Скопируйте ссылку из комнаты и отправьте её в ваш чат.' },
      { title: 'Играйте вместе', description: 'Друг открывает ссылку и подключается к той же партии.' },
    ],
    faqTitle: 'Вопросы об игре с другом',
    faq: FRIEND_GAME_FAQ,
    backToSettings: 'Выбрать время партии',
    rules: 'Правила шахмат',
    privacy: 'Конфиденциальность',
    terms: 'Условия использования',
    settings: {
      legend: 'Время партии',
      presetsLabel: 'Популярные настройки времени',
      presetLabel: '{minutes} мин каждому игроку, {increment} сек за ход',
      minutes: 'Минут на игрока',
      increment: 'Секунд за ход',
      hints: 'Подсказки AI',
      summary: '{minutes} мин + {increment} сек за ход',
      submit: 'Играть с другом',
    },
  },
  en: {
    canonical: FRIEND_GAME_EN_CANONICAL,
    locale: 'en_US',
    homeHref: '/',
    title: 'Play Chess Online with a Friend by Link for Free | Chesson',
    description: 'Play chess online with a friend for free, no sign-up required. Choose your time control, create a room and share the link to play on desktop or mobile.',
    heading: ['Play chess online', 'with a friend'],
    summary: 'Create a game and send the link to your friend.',
    benefits: 'Free · No sign-up required',
    howTitle: 'One link for your chess game',
    steps: [
      { title: 'Choose your time', description: 'Set the minutes per player and the seconds added after each move.' },
      { title: 'Invite your friend', description: 'Copy the invite link from your room and share it in your chat.' },
      { title: 'Play together', description: 'Your friend opens the link and joins the same game.' },
    ],
    faqTitle: 'Playing chess with a friend',
    faq: [
      {
        question: 'Do we need an account to play chess with a friend?',
        answer: 'No. You and your friend can play without an account, directly in your browser.',
      },
      {
        question: 'How do I send my friend a link to the game?',
        answer: 'After creating your room, copy the invite link and send it to your friend in a messaging app. They will join the same room.',
      },
      {
        question: 'Can I play on my phone while my friend uses a computer?',
        answer: 'Yes. You can use different devices. The room link opens the version of the game suited to each device.',
      },
      {
        question: 'What does the time increment mean?',
        answer: 'After each move, the selected number of seconds is added to your remaining time. For example, 3 + 2 gives each player three minutes plus two seconds per move.',
      },
      {
        question: 'Can I play chess with a friend in another country?',
        answer: 'Yes. You both need an internet connection and a browser to join the same room.',
      },
    ],
    backToSettings: 'Choose your time control',
    rules: 'Chess rules',
    privacy: 'Privacy',
    terms: 'Terms of use',
    settings: {
      legend: 'Time control',
      presetsLabel: 'Popular time controls',
      presetLabel: '{minutes} min per player, {increment} sec per move',
      minutes: 'Minutes per player',
      increment: 'Seconds per move',
      hints: 'AI hints',
      summary: '{minutes} min + {increment} sec per move',
      submit: 'Play with a friend',
    },
  },
} as const;
