package org.javaguru.eventservice.dto;

import java.time.Instant;
import java.util.List;

/**
 * Структурированный intent поиска после NL-разбора.
 *
 * @param rawQuery       исходная строка
 * @param activityIds    типы активности
 * @param from           нижняя граница startsAt
 * @param to             верхняя граница startsAt
 * @param near           центр geo-фильтра
 * @param radiusKm       радиус в км
 * @param city           распознанный город (если есть)
 * @param tagIds         теги (v1 всегда пустой)
 * @param freeText       остаток для FTS
 * @param interpretedAs  подписи для UI
 * @param confidence     0..1
 */
public record SearchIntentResponse(
        String rawQuery,
        List<String> activityIds,
        Instant from,
        Instant to,
        GeoPointDto near,
        Double radiusKm,
        String city,
        List<String> tagIds,
        String freeText,
        SearchInterpretedAsDto interpretedAs,
        double confidence
) {
}
