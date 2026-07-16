package org.javaguru.eventservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Сообщение чата для REST API.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatMessageResponse(
        String id,
        String eventId,
        UserSummaryResponse author,
        String text,
        Instant sentAt,
        boolean isOwn
) {
}
