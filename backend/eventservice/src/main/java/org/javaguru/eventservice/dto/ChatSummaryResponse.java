package org.javaguru.eventservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Элемент списка чатов пользователя.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatSummaryResponse(
        String eventId,
        String title,
        String activityId,
        UserSummaryResponse organizer,
        LastMessagePreview lastMessage,
        long unreadCount
) {
}
