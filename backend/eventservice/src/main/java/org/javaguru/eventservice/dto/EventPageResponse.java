package org.javaguru.eventservice.dto;

import java.util.List;

/**
 * Страница ивентов с cursor-пагинацией.
 */
public record EventPageResponse(
        List<EventResponse> items,
        String nextCursor,
        long total
) {
}
