package org.javaguru.eventservice.search;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.javaguru.eventservice.dto.GeoPointDto;
import org.javaguru.eventservice.dto.SearchIntentResponse;
import org.javaguru.eventservice.dto.SearchInterpretedAsDto;
import org.javaguru.eventservice.search.SearchDictionaries.City;
import org.springframework.stereotype.Component;

/**
 * NL-парсер v1 на правилах: словари дат, активностей, городов и «рядом».
 * Не использует LLM.
 */
@Component
public class RuleBasedSearchIntentParser {

    public static final ZoneId ZONE = ZoneId.of("Europe/Moscow");
    private static final double NEARBY_RADIUS_KM = 3.0;

    private final Clock clock;

    /**
     * @param clock часы (для тестов подменяется)
     */
    public RuleBasedSearchIntentParser(Clock clock) {
        this.clock = clock;
    }

    /**
     * Разбирает свободную строку в SearchIntent.
     *
     * @param rawQuery исходный запрос
     * @param userLat  GPS широта (для «рядом»)
     * @param userLng  GPS долгота
     * @return структурированный intent
     */
    public SearchIntentResponse parse(String rawQuery, Double userLat, Double userLng) {
        String raw = rawQuery == null ? "" : rawQuery.trim();
        List<Token> tokens = tokenize(raw);

        Set<String> activityIds = new LinkedHashSet<>();
        List<String> leftover = new ArrayList<>();
        boolean wantToday = false;
        boolean wantTomorrow = false;
        boolean wantWeekend = false;
        boolean wantEvening = false;
        boolean wantMorning = false;
        boolean wantNearby = false;
        boolean sawNext = false;
        boolean sawThis = false;
        boolean sawWeekWord = false;
        boolean sawMonthWord = false;
        boolean sawYearWord = false;
        DayOfWeek wantWeekday = null;
        City city = null;

        for (Token token : tokens) {
            if (token.consumed) {
                continue;
            }
            String key = token.key;
            if (key.isEmpty() || SearchDictionaries.NOISE.contains(key) || SearchDictionaries.OR_WORDS.contains(key)) {
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.TODAY.contains(key)) {
                wantToday = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.TOMORROW.contains(key)) {
                wantTomorrow = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.WEEKEND.contains(key)) {
                wantWeekend = true;
                token.consumed = true;
                continue;
            }
            // «следующей/этой» — общие маркеры для недели/месяца/года
            if (SearchDictionaries.NEXT_WEEK.contains(key)) {
                sawNext = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.THIS_WEEK.contains(key)) {
                sawThis = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.WEEK_WORD.contains(key)) {
                sawWeekWord = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.MONTH_WORD.contains(key)) {
                sawMonthWord = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.YEAR_WORD.contains(key)) {
                sawYearWord = true;
                token.consumed = true;
                continue;
            }
            DayOfWeek weekday = SearchDictionaries.WEEKDAYS.get(key);
            if (weekday != null) {
                wantWeekday = weekday;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.EVENING.contains(key)) {
                wantEvening = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.MORNING.contains(key)) {
                wantMorning = true;
                token.consumed = true;
                continue;
            }
            if (SearchDictionaries.NEARBY.contains(key)) {
                wantNearby = true;
                token.consumed = true;
                continue;
            }
            String activityId = SearchDictionaries.ACTIVITIES.get(key);
            if (activityId == null) {
                activityId = fuzzyActivity(key);
            }
            if (activityId != null) {
                activityIds.add(activityId);
                token.consumed = true;
                continue;
            }
            City matchedCity = SearchDictionaries.CITIES.get(key);
            if (matchedCity != null) {
                city = matchedCity;
                token.consumed = true;
                continue;
            }
            leftover.add(token.original);
            token.consumed = true;
        }

        // Приоритет: год → месяц → неделя (если есть явная единица времени)
        boolean wantNextYear = sawNext && sawYearWord;
        boolean wantThisYear = sawThis && sawYearWord && !sawNext;
        boolean wantNextMonth = sawNext && sawMonthWord && !sawYearWord;
        boolean wantThisMonth = (sawThis && sawMonthWord && !sawYearWord)
                || (sawMonthWord && !sawNext && !sawThis && !sawWeekWord && !sawYearWord);
        // «в этом месяце» = этой + месяце; голое «месяце» без маркера — тоже этот месяц
        boolean wantNextWeek = sawNext && sawWeekWord && !sawMonthWord && !sawYearWord;
        // «следующей» без единицы → следующая неделя (обратная совместимость)
        if (sawNext && !sawWeekWord && !sawMonthWord && !sawYearWord) {
            wantNextWeek = true;
        }
        boolean wantThisWeek = sawThis && sawWeekWord && !sawMonthWord && !sawYearWord && !sawNext;

        InstantRange range = resolveDates(
                wantToday,
                wantTomorrow,
                wantWeekend,
                wantWeekday,
                wantNextWeek,
                wantThisWeek,
                wantNextMonth,
                wantThisMonth,
                wantNextYear,
                wantThisYear,
                wantMorning,
                wantEvening
        );
        GeoPointDto near = null;
        Double radiusKm = null;
        String cityLabel = null;
        String whereLabel = null;

        if (wantNearby && userLat != null && userLng != null) {
            near = new GeoPointDto(userLat, userLng);
            radiusKm = NEARBY_RADIUS_KM;
            whereLabel = "Рядом · " + (int) NEARBY_RADIUS_KM + " км";
        } else if (city != null) {
            near = new GeoPointDto(city.lat(), city.lng());
            radiusKm = city.radiusKm();
            cityLabel = city.label();
            whereLabel = city.label();
        } else if (wantNearby) {
            whereLabel = "Рядом (нужна геолокация)";
        }

        String freeText = leftover.isEmpty() ? null : String.join(" ", leftover);
        String what = activityIds.isEmpty()
                ? null
                : activityIds.stream().map(SearchDictionaries::activityLabelRu).reduce((a, b) -> a + ", " + b).orElse(null);
        String when = range.label();

        double confidence = 0.35;
        if (!activityIds.isEmpty()) {
            confidence += 0.25;
        }
        if (range.from() != null || range.to() != null) {
            confidence += 0.2;
        }
        if (near != null) {
            confidence += 0.2;
        }
        if (wantNearby && near == null) {
            confidence -= 0.1;
        }
        confidence = Math.max(0.0, Math.min(1.0, confidence));

        return new SearchIntentResponse(
                raw,
                List.copyOf(activityIds),
                range.from(),
                range.to(),
                near,
                radiusKm,
                cityLabel,
                List.of(),
                freeText,
                new SearchInterpretedAsDto(when, what, whereLabel),
                confidence
        );
    }

    private InstantRange resolveDates(
            boolean wantToday,
            boolean wantTomorrow,
            boolean wantWeekend,
            DayOfWeek wantWeekday,
            boolean wantNextWeek,
            boolean wantThisWeek,
            boolean wantNextMonth,
            boolean wantThisMonth,
            boolean wantNextYear,
            boolean wantThisYear,
            boolean wantMorning,
            boolean wantEvening
    ) {
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(ZONE));
        LocalDate today = now.toLocalDate();

        if (wantNextYear) {
            LocalDate start = LocalDate.of(today.getYear() + 1, 1, 1);
            LocalDate end = LocalDate.of(today.getYear() + 1, 12, 31);
            return monthLikeRange(start, end, wantMorning, wantEvening, "Следующий год");
        }

        if (wantThisYear) {
            LocalDate start = today;
            LocalDate end = LocalDate.of(today.getYear(), 12, 31);
            return monthLikeRange(start, end, wantMorning, wantEvening, "Этот год");
        }

        if (wantNextMonth) {
            LocalDate start = today.withDayOfMonth(1).plusMonths(1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            return monthLikeRange(start, end, wantMorning, wantEvening, "Следующий месяц");
        }

        if (wantThisMonth) {
            LocalDate start = today;
            LocalDate end = today.withDayOfMonth(today.lengthOfMonth());
            return monthLikeRange(start, end, wantMorning, wantEvening, "Этот месяц");
        }

        if (wantNextWeek) {
            LocalDate nextMonday = today.with(DayOfWeek.MONDAY).plusWeeks(1);
            LocalDate nextSunday = nextMonday.plusDays(6);
            Instant from = atStart(nextMonday);
            Instant to = atEnd(nextSunday);
            if (wantEvening) {
                from = atTime(nextMonday, 18, 0);
            }
            if (wantMorning) {
                from = atTime(nextMonday, 6, 0);
                to = atTime(nextSunday, 12, 0);
            }
            return new InstantRange(from, to, "Следующая неделя");
        }

        if (wantThisWeek) {
            LocalDate monday = today.with(DayOfWeek.MONDAY);
            LocalDate sunday = monday.plusDays(6);
            Instant from = atStart(today.isAfter(monday) ? today : monday);
            Instant to = atEnd(sunday);
            if (wantEvening) {
                from = atTime(today, 18, 0);
            }
            if (wantMorning) {
                from = atTime(today, 6, 0);
                to = atTime(sunday, 12, 0);
            }
            return new InstantRange(from, to, "Эта неделя");
        }

        if (wantWeekday != null) {
            LocalDate day = nextOrSame(today, wantWeekday);
            Instant from = atStart(day);
            Instant to = atEnd(day);
            String label = SearchDictionaries.weekdayLabelRu(wantWeekday);
            if (wantEvening) {
                from = atTime(day, 18, 0);
                label = label + ", вечер";
            }
            if (wantMorning) {
                from = atTime(day, 6, 0);
                to = atTime(day, 12, 0);
                label = SearchDictionaries.weekdayLabelRu(wantWeekday) + ", утро";
            }
            return new InstantRange(from, to, label);
        }

        if (wantWeekend) {
            LocalDate saturday = today.with(DayOfWeek.SATURDAY);
            if (saturday.isBefore(today)) {
                saturday = saturday.plusWeeks(1);
            }
            LocalDate sunday = saturday.plusDays(1);
            Instant from = atStart(saturday);
            Instant to = atEnd(sunday);
            if (wantEvening) {
                from = atTime(saturday, 18, 0);
            }
            if (wantMorning) {
                from = atTime(saturday, 6, 0);
                to = atTime(sunday, 12, 0);
            }
            return new InstantRange(from, to, "Выходные");
        }

        if (!wantToday && !wantTomorrow && !wantMorning && !wantEvening) {
            return InstantRange.empty();
        }

        LocalDate startDay = today;
        LocalDate endDay = today;
        List<String> labels = new ArrayList<>();

        if (wantToday && wantTomorrow) {
            startDay = today;
            endDay = today.plusDays(1);
            labels.add("Сегодня–завтра");
        } else if (wantTomorrow) {
            startDay = today.plusDays(1);
            endDay = startDay;
            labels.add("Завтра");
        } else if (wantToday) {
            labels.add("Сегодня");
        } else if (wantEvening || wantMorning) {
            labels.add("Сегодня");
        }

        Instant from = atStart(startDay);
        Instant to = atEnd(endDay);

        if (wantEvening) {
            from = atTime(startDay, 18, 0);
            to = atEnd(endDay);
            if (!labels.contains("Вечер")) {
                labels.add("вечер");
            }
        }
        if (wantMorning) {
            from = atTime(startDay, 6, 0);
            to = atTime(endDay, 12, 0);
            if (!labels.contains("утро") && !labels.contains("Утро")) {
                labels.add("утро");
            }
        }

        String label = String.join(", ", labels);
        label = label.substring(0, 1).toUpperCase(Locale.ROOT) + label.substring(1);
        return new InstantRange(from, to, label);
    }

    private InstantRange monthLikeRange(
            LocalDate start,
            LocalDate end,
            boolean wantMorning,
            boolean wantEvening,
            String label
    ) {
        Instant from = atStart(start);
        Instant to = atEnd(end);
        if (wantEvening) {
            from = atTime(start, 18, 0);
        }
        if (wantMorning) {
            from = atTime(start, 6, 0);
            to = atTime(end, 12, 0);
        }
        return new InstantRange(from, to, label);
    }

    /**
     * Ближайший день недели (включая сегодня).
     *
     * @param from сегодня
     * @param day  нужный день
     * @return дата
     */
    private LocalDate nextOrSame(LocalDate from, DayOfWeek day) {
        LocalDate candidate = from.with(day);
        if (candidate.isBefore(from)) {
            candidate = candidate.plusWeeks(1);
        }
        return candidate;
    }

    private Instant atStart(LocalDate date) {
        return date.atStartOfDay(ZONE).toInstant();
    }

    private Instant atEnd(LocalDate date) {
        return date.atTime(LocalTime.of(23, 59, 59)).atZone(ZONE).toInstant();
    }

    private Instant atTime(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(ZONE).toInstant();
    }

    private String fuzzyActivity(String key) {
        if (key.length() < 4) {
            return null;
        }
        String best = null;
        int bestDistance = 2;
        for (var entry : SearchDictionaries.ACTIVITIES.entrySet()) {
            int distance = editDistance(key, entry.getKey());
            if (distance > 0 && distance < bestDistance && entry.getKey().length() >= 4) {
                bestDistance = distance;
                best = entry.getValue();
            }
        }
        return best;
    }

    private int editDistance(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = cur;
            cur = tmp;
        }
        return prev[b.length()];
    }

    private List<Token> tokenize(String raw) {
        String normalized = raw.toLowerCase(Locale.ROOT).replace('ё', 'е');
        String[] parts = normalized.split("\\s+");
        List<Token> tokens = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            String key = SearchDictionaries.normalizeKey(part);
            tokens.add(new Token(part, key, false));
        }
        return tokens;
    }

    private static final class Token {
        private final String original;
        private final String key;
        private boolean consumed;

        private Token(String original, String key, boolean consumed) {
            this.original = original;
            this.key = key;
            this.consumed = consumed;
        }
    }

    private record InstantRange(Instant from, Instant to, String label) {
        static InstantRange empty() {
            return new InstantRange(null, null, null);
        }
    }
}
