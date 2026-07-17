package org.javaguru.eventservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Превью последнего сообщения в списке чатов.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LastMessagePreview(
        String text,
        Instant sentAt,
        boolean isOwn
) {
}
