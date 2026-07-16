package org.javaguru.userservice.dto;

import java.time.Instant;

/**
 * Стандартный ответ об ошибке API.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
