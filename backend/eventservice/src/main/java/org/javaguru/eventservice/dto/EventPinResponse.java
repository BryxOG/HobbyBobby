package org.javaguru.eventservice.dto;

import java.time.Instant;

/**
 * Облегчённое представление ивента для карты — контракт фронтенда {@code EventPin}.
 */
public record EventPinResponse(
        String id,
        String activityId,
        EventLocationDto location,
        String title,
        Instant startsAt,
        int participantCount,
        int capacity
) {
}
