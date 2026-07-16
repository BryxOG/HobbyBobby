package org.javaguru.eventservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на отправку сообщения в чат ивента.
 */
public record SendMessageRequest(
        @NotBlank @Size(min = 1, max = 4000) String text
) {
}
