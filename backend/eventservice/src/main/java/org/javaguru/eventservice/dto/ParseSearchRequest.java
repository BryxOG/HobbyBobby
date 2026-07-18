package org.javaguru.eventservice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Запрос разбора NL-строки поиска.
 *
 * @param query   свободный текст пользователя
 * @param userLat опциональная широта (для «рядом»)
 * @param userLng опциональная долгота (для «рядом»)
 */
public record ParseSearchRequest(
        @NotBlank String query,
        Double userLat,
        Double userLng
) {
}
