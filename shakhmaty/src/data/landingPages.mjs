/** @type {Array<{slug: string, heading: string, title: string, description: string, primaryMode?: 'friend' | 'bot', buttons: { text: string, apperance: string, mode: string }[]}>} */
export const landingPages = [
  {
    slug: 'shahmaty_online_besplatno',
    heading: 'онлайн бесплатно',
    title: 'Шахматы онлайн бесплатно — без регистрации',
    description: 'Играйте в шахматы бесплатно с другом по ссылке или против бота. Без регистрации и установки приложения.',
    buttons: [
      {
        text: "Играть с другом бесплатно",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом бесплатно",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_s_drugom_online',
    heading: 'с другом онлайн',
    title: 'Шахматы с другом онлайн — по ссылке без регистрации',
    description: 'Создайте комнату и отправьте ссылку другу. Играйте в шахматы онлайн вместе с телефона или компьютера, без регистрации.',
    buttons: [
      {
        text: "Играть с другом",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_online_s_drugom_po_ssylke',
    heading: 'онлайн с другом по ссылке',
    title: 'Шахматы онлайн с другом по ссылке — бесплатно',
    description: 'Создайте шахматную комнату одним нажатием, скопируйте ссылку и отправьте другу. Играйте онлайн бесплатно, без регистрации.',
    buttons: [
      {
        text: "Играть с другом по ссылке",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_online_s_drugom',
    heading: 'онлайн с другом',
    title: 'Шахматы онлайн с другом — без регистрации',
    description: 'Играйте в шахматы онлайн с другом на 3D-доске. Откройте комнату, пригласите соперника по ссылке и начните бесплатную партию.',
    buttons: [
      {
        text: "Создать комнату",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'onlayn_shahmaty_po_ssylke_s_drugom',
    heading: 'онлайн по ссылке с другом',
    title: 'Онлайн шахматы по ссылке с другом — без регистрации',
    description: 'Пригласите друга в онлайн-шахматы по ссылке на комнату. Играйте друг с другом в браузере с телефона или компьютера, без установки.',
    buttons: [
      {
        text: "Создать комнату",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_s_drugom_onlayn',
    heading: 'с другом онлайн по ссылке',
    title: 'Шахматы с другом онлайн — бесплатная игра на двоих',
    description: 'Начните партию в шахматы с другом онлайн: создайте комнату и поделитесь ссылкой. Бесплатная игра на двоих без регистрации.',
    buttons: [
      {
        text: "Создать ссылку на комнату",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_s_drugom',
    heading: 'с другом',
    title: 'Шахматы с другом — играть бесплатно по ссылке',
    description: 'Сыграйте в шахматы с другом, даже если вы далеко друг от друга. Отправьте ссылку на созданную комнату и играйте бесплатно в браузере.',
    buttons: [
      {
        text: "Играть с другом онлайн",
        apperance: "primary",
        mode: "friend",
      },
      {
        text: "Играть с ботом онлайн",
        apperance: "secondary",
        mode: "bot",
      },
    ],
  },
  {
    slug: 'shahmaty_online_s_botom',
    primaryMode: 'bot',
    heading: 'онлайн играть с ботом',
    title: 'Шахматы онлайн играть с ботом — бесплатно без регистрации',
    description: 'Играйте в шахматы онлайн против компьютера. Партия с ботом начинается сразу, бесплатно и без регистрации.',
    buttons: [
      {
        text: "Играть с ботом любой сложности",
        apperance: "primary",
        mode: "bot",
      },
      {
        text: "Играть с другом",
        apperance: "secondary",
        mode: "friend",
      },
    ],
  },
];
