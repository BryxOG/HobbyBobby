package org.javaguru.eventservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Полная карточка ивента — контракт фронтенда {@code EventItem}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventResponse(
        String id,
        String title,
        String activityId,
        String description,
        Instant startsAt,
        Instant endsAt,
        EventLocationDto location,
        UserSummaryResponse organizer,
        List<UserSummaryResponse> participants,
        int capacity,
        List<TagResponse> tags,
        boolean isJoined,
        BigDecimal rating
) {
}
