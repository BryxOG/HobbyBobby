package org.javaguru.eventservice.search;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.javaguru.eventservice.dto.SearchIntentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Тесты NL-парсера v1 (правила).
 */
class RuleBasedSearchIntentParserTest {

    private RuleBasedSearchIntentParser parser;

    @BeforeEach
    void setUp() {
        // 2026-07-17 12:00 MSK = 09:00 UTC
        Instant fixed = LocalDate.of(2026, 7, 17)
                .atTime(12, 0)
                .atZone(RuleBasedSearchIntentParser.ZONE)
                .toInstant();
        parser = new RuleBasedSearchIntentParser(Clock.fixed(fixed, ZoneOffset.UTC));
    }

    @Test
    void parseFootballTodayOrTomorrowInMoscow() {
        SearchIntentResponse intent = parser.parse(
                "найди седня или завтра футбик в москоу",
                null,
                null
        );

        assertEquals(1, intent.activityIds().size());
        assertEquals("football", intent.activityIds().getFirst());
        assertEquals("Москва", intent.city());
        assertNotNull(intent.from());
        assertNotNull(intent.to());
        assertNotNull(intent.near());
        assertEquals(25.0, intent.radiusKm());
        assertNull(intent.freeText());
        assertEquals("Футбол", intent.interpretedAs().what());
        assertEquals("Москва", intent.interpretedAs().where());
        assertTrue(intent.confidence() >= 0.7);
    }

    @Test
    void parseNearbyRequiresGps() {
        SearchIntentResponse withoutGps = parser.parse("футбик рядом", null, null);
        assertEquals("football", withoutGps.activityIds().getFirst());
        assertNull(withoutGps.near());

        SearchIntentResponse withGps = parser.parse("футбик рядом", 55.75, 37.62);
        assertNotNull(withGps.near());
        assertEquals(3.0, withGps.radiusKm());
        assertEquals(55.75, withGps.near().lat());
    }

    @Test
    void parseLeavesFreeTextForUnknownTokens() {
        SearchIntentResponse intent = parser.parse("завтра футбол вднх", null, null);
        assertEquals("football", intent.activityIds().getFirst());
        assertEquals("вднх", intent.freeText());
        assertNotNull(intent.from());
    }

    @Test
    void parseBeerSlangMapsToBar() {
        SearchIntentResponse intent = parser.parse("попить пивка", null, null);
        assertEquals("bar", intent.activityIds().getFirst());
        assertEquals("Бар", intent.interpretedAs().what());
        assertNull(intent.freeText());
    }

    @Test
    void parseBeerGenitiveMapsToBar() {
        SearchIntentResponse intent = parser.parse("выпить пива", null, null);
        assertEquals("bar", intent.activityIds().getFirst());
        assertNull(intent.freeText());
    }

    @Test
    void parseBikeSlangMapsToCycling() {
        SearchIntentResponse intent = parser.parse("погонять на велике", null, null);
        assertEquals("cycling", intent.activityIds().getFirst());
        assertEquals("Велопрогулка", intent.interpretedAs().what());
        assertNull(intent.freeText());
    }

    @Test
    void parseFootballThisMonth() {
        SearchIntentResponse intent = parser.parse("найди футбол в этом месяце", null, null);
        assertEquals("football", intent.activityIds().getFirst());
        assertNotNull(intent.from());
        assertNotNull(intent.to());
        assertNull(intent.freeText());
        assertEquals("Этот месяц", intent.interpretedAs().when());
    }

    @Test
    void parseKaraokeNextMonth() {
        SearchIntentResponse intent = parser.parse("караоке в следующем месяце", null, null);
        assertEquals("karaoke", intent.activityIds().getFirst());
        assertEquals("Следующий месяц", intent.interpretedAs().when());
    }

    @Test
    void parseFootballNextWeek() {
        SearchIntentResponse intent = parser.parse("найди футбол на следующей неделе", null, null);
        assertEquals("football", intent.activityIds().getFirst());
        assertNotNull(intent.from());
        assertNotNull(intent.to());
        assertNull(intent.freeText());
        assertEquals("Следующая неделя", intent.interpretedAs().when());
        assertEquals("Футбол", intent.interpretedAs().what());
    }

    @Test
    void parseFindTomorrowFootball() {
        SearchIntentResponse intent = parser.parse("найди завтра футбик", null, null);
        assertEquals("football", intent.activityIds().getFirst());
        assertNotNull(intent.from());
        assertNotNull(intent.to());
        assertNull(intent.freeText());
        assertEquals("Завтра", intent.interpretedAs().when());
        assertEquals("Футбол", intent.interpretedAs().what());
    }

    @Test
    void parseSaturdayFootball() {
        SearchIntentResponse intent = parser.parse("футбол в субботу", null, null);
        assertEquals("football", intent.activityIds().getFirst());
        assertNotNull(intent.from());
        assertNotNull(intent.to());
        assertEquals("Суббота", intent.interpretedAs().when());
    }

    @Test
    void parseEmptyNoiseOnly() {
        SearchIntentResponse intent = parser.parse("найди пожалуйста", null, null);
        assertTrue(intent.activityIds().isEmpty());
        assertNull(intent.from());
        assertNull(intent.near());
    }
}
