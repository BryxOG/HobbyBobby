package org.javaguru.eventservice.search;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.time.DayOfWeek;

/**
 * Словари NL-парсера v1 (правила, без LLM).
 */
final class SearchDictionaries {

    static final Set<String> NOISE = Set.of(
            "найди", "найти", "ищу", "хочу", "хочется", "пожалуйста", "пж",
            "давай", "покажи", "показать", "есть", "какие", "какой", "какая",
            "ивент", "ивенты", "событие", "события", "в", "на", "по", "у", "к",
            "для", "с", "со", "и", "а", "но", "же", "ли", "бы", "это", "там"
    );

    /** Синоним → activityId. */
    static final Map<String, String> ACTIVITIES = activityMap();

    /** Синоним → город (label, lat, lng, radiusKm). */
    static final Map<String, City> CITIES = cityMap();

    static final Set<String> NEARBY = Set.of(
            "рядом", "около", "возле", "поблизости", "недалеко", "близько", "близко"
    );

    static final Set<String> TODAY = Set.of(
            "сегодня", "седня", "сёдня", "today", "сейчас"
    );

    static final Set<String> TOMORROW = Set.of(
            "завтра", "tomorrow"
    );

    static final Set<String> WEEKEND = Set.of(
            "выходные", "выходных", "уикенд", "weekend"
    );

    /** «на следующей неделе» / «в следующем месяце» / next. */
    static final Set<String> NEXT_WEEK = Set.of(
            "следующей", "следующую", "следующая", "следующее",
            "следующем", "следующий", "следующих", "следующему",
            "след", "next"
    );

    static final Set<String> WEEK_WORD = Set.of(
            "неделе", "недели", "неделя", "неделю", "week"
    );

    /** «на этой неделе». */
    static final Set<String> THIS_WEEK = Set.of(
            "этой", "эта", "этом", "этот", "этих",
            "текущей", "текущая", "текущем", "текущий", "this"
    );

    static final Set<String> MONTH_WORD = Set.of(
            "месяце", "месяца", "месяц", "месяцу", "month"
    );

    static final Set<String> YEAR_WORD = Set.of(
            "году", "года", "год", "годом", "year"
    );

    /** Синоним дня недели → DayOfWeek (после normalizeKey: субботу → субботу). */
    static final Map<String, java.time.DayOfWeek> WEEKDAYS = weekdayMap();

    static final Set<String> EVENING = Set.of(
            "вечером", "вечер", "вечерком"
    );

    static final Set<String> MORNING = Set.of(
            "утром", "утро"
    );

    static final Set<String> OR_WORDS = Set.of("или", "либо", "or");

    private SearchDictionaries() {
    }

    record City(String label, double lat, double lng, double radiusKm) {
    }

    private static Map<String, DayOfWeek> weekdayMap() {
        Map<String, DayOfWeek> map = new LinkedHashMap<>();
        putWeekday(map, DayOfWeek.MONDAY, "понедельник", "понедельника", "понедельнику", "пн", "monday");
        putWeekday(map, DayOfWeek.TUESDAY, "вторник", "вторника", "вторнику", "вт", "tuesday");
        putWeekday(map, DayOfWeek.WEDNESDAY, "среда", "среды", "среду", "среде", "ср", "wednesday");
        putWeekday(map, DayOfWeek.THURSDAY, "четверг", "четверга", "четвергу", "чт", "thursday");
        putWeekday(map, DayOfWeek.FRIDAY, "пятница", "пятницы", "пятницу", "пятнице", "пт", "friday");
        putWeekday(map, DayOfWeek.SATURDAY, "суббота", "субботы", "субботу", "субботе", "сб", "saturday");
        putWeekday(map, DayOfWeek.SUNDAY, "воскресенье", "воскресенья", "воскресенью", "вс", "sunday");
        return Map.copyOf(map);
    }

    private static void putWeekday(Map<String, DayOfWeek> map, DayOfWeek day, String... synonyms) {
        for (String synonym : synonyms) {
            map.put(normalizeKey(synonym), day);
        }
    }

    static String weekdayLabelRu(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Понедельник";
            case TUESDAY -> "Вторник";
            case WEDNESDAY -> "Среда";
            case THURSDAY -> "Четверг";
            case FRIDAY -> "Пятница";
            case SATURDAY -> "Суббота";
            case SUNDAY -> "Воскресенье";
        };
    }

    private static Map<String, String> activityMap() {
        Map<String, String> map = new LinkedHashMap<>();
        putAll(map, "basketball", "basketball", "баскетбол", "баскет", "стритбол", "3х3", "3x3");
        putAll(map, "football", "football", "футбол", "футбик", "футболл", "soccer", "фут", "5х5", "5x5");
        putAll(map, "volleyball", "volleyball", "волейбол", "пляжный");
        putAll(map, "boxing", "boxing", "бокс", "спарринг");
        putAll(map, "skating", "skating", "коньки", "каток");
        putAll(map, "tennis", "tennis", "теннис");
        putAll(map, "cycling", "cycling", "велопрогулка", "велосипед", "вело", "байк",
                "велик", "велике", "велика", "великом", "велосипеде",
                "погонять", "покататься", "крутануть");
        putAll(map, "baseball", "baseball", "бейсбол");
        putAll(map, "bowling", "bowling", "боулинг");
        putAll(map, "karaoke", "karaoke", "караоке");
        putAll(map, "gaming", "gaming", "видеоигры", "игры", "приставки", "фифа", "fifa");
        putAll(map, "art", "art", "творчество", "рисование", "скетчинг");
        putAll(map, "crafts", "crafts", "рукоделие", "вязание");
        putAll(map, "boardgames", "boardgames", "настолки", "настольные", "мафия");
        putAll(map, "coffee", "coffee", "кофе", "кофейню", "кофейку", "кофеек", "кофеёк");
        putAll(map, "bar", "bar", "бар", "бары", "барчик", "барик", "паб",
                "пиво", "пива", "пивка", "пивко", "пивком", "пивас", "пивнуха", "пивную",
                "попить", "выпить", "выпьем", "бухнуть", "бахнем", "бахнуть",
                "накатим", "накатить", "крафт", "коктейли", "afterwork");
        putAll(map, "party", "party", "дискотека", "вечеринка", "пати");
        putAll(map, "theatre", "theatre", "театр");
        putAll(map, "support", "support", "поддержки", "поддержка");
        return Map.copyOf(map);
    }

    private static Map<String, City> cityMap() {
        Map<String, City> map = new LinkedHashMap<>();
        putCity(map, new City("Москва", 55.7558, 37.6173, 25),
                "москва", "москоу", "мск", "moscow", "москве", "москвы");
        putCity(map, new City("Санкт-Петербург", 59.9343, 30.3351, 20),
                "питер", "спб", "петербург", "санктпетербург", "санкт-петербург", "spb");
        putCity(map, new City("Казань", 55.7961, 49.1064, 15),
                "казань", "казани", "kazan");
        putCity(map, new City("Новосибирск", 55.0084, 82.9357, 15),
                "новосибирск", "новосиб");
        putCity(map, new City("Екатеринбург", 56.8389, 60.6057, 15),
                "екатеринбург", "екб", "ебург");
        putCity(map, new City("Нижний Новгород", 56.2965, 43.9361, 15),
                "нижний", "нижегород", "нн");
        putCity(map, new City("Самара", 53.1959, 50.1002, 15),
                "самара", "самаре");
        putCity(map, new City("Ростов-на-Дону", 47.2357, 39.7015, 15),
                "ростов", "ростове");
        putCity(map, new City("Краснодар", 45.0355, 38.9753, 15),
                "краснодар");
        putCity(map, new City("Сочи", 43.6028, 39.7342, 15),
                "сочи");
        putCity(map, new City("Воронеж", 51.6720, 39.1843, 15),
                "воронеж");
        return Map.copyOf(map);
    }

    private static void putAll(Map<String, String> map, String activityId, String... synonyms) {
        for (String synonym : synonyms) {
            map.put(normalizeKey(synonym), activityId);
        }
    }

    private static void putCity(Map<String, City> map, City city, String... synonyms) {
        for (String synonym : synonyms) {
            map.put(normalizeKey(synonym), city);
        }
    }

    static String normalizeKey(String raw) {
        if (raw == null) {
            return "";
        }
        String lower = raw.toLowerCase().replace('ё', 'е').trim();
        StringBuilder builder = new StringBuilder(lower.length());
        for (int i = 0; i < lower.length(); i++) {
            char ch = lower.charAt(i);
            if (Character.isLetterOrDigit(ch)) {
                builder.append(ch);
            }
        }
        return builder.toString();
    }

    static String activityLabelRu(String activityId) {
        return switch (activityId) {
            case "basketball" -> "Баскетбол";
            case "football" -> "Футбол";
            case "volleyball" -> "Волейбол";
            case "boxing" -> "Бокс";
            case "skating" -> "Коньки";
            case "tennis" -> "Теннис";
            case "cycling" -> "Велопрогулка";
            case "baseball" -> "Бейсбол";
            case "bowling" -> "Боулинг";
            case "karaoke" -> "Караоке";
            case "gaming" -> "Видеоигры";
            case "art" -> "Творчество";
            case "crafts" -> "Рукоделие";
            case "boardgames" -> "Настолки";
            case "coffee" -> "Кофе";
            case "bar" -> "Бар";
            case "party" -> "Дискотека";
            case "theatre" -> "Театр";
            case "support" -> "Группа поддержки";
            default -> activityId;
        };
    }
}
