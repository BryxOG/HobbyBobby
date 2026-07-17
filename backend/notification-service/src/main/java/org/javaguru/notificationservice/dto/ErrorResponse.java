package org.javaguru.notificationservice.dto;

import java.time.Instant;

/**
 * Стандартный ответ об ошибке REST API.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
