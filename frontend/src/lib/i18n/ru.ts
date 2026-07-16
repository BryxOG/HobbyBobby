/**
 * Every user-facing string. Adding a language = copying this file and adding it
 * to `locales` in ./index.ts — no screen changes.
 */
export const ru = {
  common: {
    back: "Назад",
    cancel: "Отмена",
    save: "Сохранить",
    done: "Готово",
    edit: "Редактировать",
    next: "Далее",
    retry: "Повторить",
    loading: "Загрузка…",
    empty: "Пока пусто",
    error: "Что-то пошло не так",
    search: "Поиск",
    of: "из",
  },

  tabs: {
    events: "Ивенты",
    chats: "Чаты",
    create: "Создать",
    map: "Карта",
    menu: "Профиль",
  },

  activities: {
    basketball: "Баскетбол",
    football: "Футбол",
    volleyball: "Волейбол",
    boxing: "Бокс",
    skating: "Коньки",
    tennis: "Теннис",
    cycling: "Велопрогулка",
    baseball: "Бейсбол",
    bowling: "Боулинг",
    karaoke: "Караоке",
    gaming: "Видеоигры",
    art: "Творчество",
    crafts: "Рукоделие",
    boardgames: "Настолки",
    coffee: "Кофе",
    bar: "Бар",
    party: "Дискотека",
    theatre: "Театр",
    support: "Группа поддержки",
  },

  categories: {
    sport: "Спорт",
    hobby: "Хобби и творчество",
    social: "Встречи",
  },

  events: {
    title: "Ивенты",
    searchPlaceholder: "Поиск по ивентам",
    createdBy: "Создал(а)",
    description: "Описание",
    dateTime: "Дата и время",
    participants: "Участвуют",
    participantsList: "Участники",
    join: "Участвовать",
    leave: "Отменить",
    full: "Мест нет",
    joined: "Вы участвуете",
    lastEvent: "Последнее событие",
    empty: "Ивентов не найдено",
    emptyHint: "Попробуйте изменить фильтры или создайте свой ивент",
    openChat: "Чат ивента",
    loadMore: "Показать ещё",
  },

  create: {
    chooseType: "Выберите тип",
    typeChosen: "Тип выбран",
    details: "Детали",
    detailsTitle: "Название",
    detailsTitlePlaceholder: "Например, Караоке в пятницу",
    detailsDescription: "Описание",
    detailsDescriptionPlaceholder: "Расскажите, что будет на ивенте",
    detailsWhen: "Когда",
    detailsStart: "Начало",
    detailsEnd: "Конец",
    detailsPlace: "Место",
    detailsPlacePlaceholder: "Адрес или название места",
    detailsCapacity: "Сколько человек",
    detailsPickOnMap: "Указать на карте",
    publish: "Публикация",
    publishOnce: "Разовая публикация",
    publishCta: "Опубликовать",
    publishing: "Публикуем…",
    published: "Опубликовано",
    publishedHint: "Ваш ивент виден на карте и в ленте",
    viewOnMap: "Смотреть карту",
    summary: "Что публикуем",
    errorTitle: "Введите название",
    errorDescription: "Добавьте описание",
    errorPlace: "Укажите место",
    errorTime: "Конец должен быть позже начала",
  },

  chats: {
    title: "Чаты",
    empty: "Нет чатов",
    emptyHint: "Вступите в ивент — его чат появится здесь",
    you: "Вы",
    placeholder: "Сообщение",
    send: "Отправить",
    noMessages: "Сообщений пока нет",
    startHint: "Напишите первым",
  },

  map: {
    title: "Карта",
    filter: "Виды активности",
    filterAll: "Все",
    reset: "Сбросить",
    locate: "Моё местоположение",
    locating: "Ищем вас…",
    locationDenied: "Доступ к геолокации запрещён",
    geoOff: "Геолокация выключена в настройках",
    nothingHere: "Здесь пока нет ивентов",
    pinsCount: (n: number) => `${n} ${plural(n, "ивент", "ивента", "ивентов")}`,
  },

  menu: {
    title: "Профиль",
    profile: "Профиль",
    myEvents: "Мои события",
    interests: "Интересы",
    settings: "Настройки",
    logout: "Выйти",
    themeLight: "Светлая тема",
    themeDark: "Тёмная тема",
  },

  profile: {
    title: "Профиль",
    followers: "Подписчиков",
    following: "Подписок",
    events: "Событий",
    level: "LVL",
    city: "Город",
    about: "О себе",
    email: "Email",
    name: "Имя",
    editName: "Изменить имя",
    editCity: "Изменить город",
    editBio: "Изменить «о себе»",
    saved: "Сохранено",
  },

  myEvents: {
    title: "Мои события",
    organizing: "Организую",
    participating: "Участвую",
    emptyOrganizing: "Вы пока не создали ни одного ивента",
    emptyParticipating: "Вы пока никуда не вступили",
  },

  interests: {
    title: "Интересы",
    hint: "Выберите, что вам интересно — по этому подбирается лента и карта",
    saved: "Интересы сохранены",
    count: (n: number) => `Выбрано: ${n}`,
  },

  settings: {
    title: "Настройки",
    notifications: "Уведомления",
    notificationsHint: "Новые сообщения и напоминания об ивентах",
    geolocation: "Геолокация",
    geolocationHint: "Нужна, чтобы показывать ивенты рядом с вами",
    language: "Язык",
    theme: "Тема",
    install: "Установить приложение",
    installHint: "Добавить на главный экран",
  },

  time: {
    now: "только что",
    minutesAgo: (n: number) => `${n} мин.`,
    hoursAgo: (n: number) => `${n} ч.`,
    daysAgo: (n: number) => `${n} дн.`,
    weeksAgo: (n: number) => `${n} нед.`,
  },
} as const;

/** Russian needs 3 plural forms; Intl.PluralRules gives us the category. */
function plural(n: number, one: string, few: string, many: string): string {
  const rule = new Intl.PluralRules("ru-RU").select(n);
  if (rule === "one") return one;
  if (rule === "few") return few;
  return many;
}

export type Dictionary = typeof ru;
