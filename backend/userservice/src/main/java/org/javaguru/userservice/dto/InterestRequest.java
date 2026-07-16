package org.javaguru.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на создание или обновление интереса.
 */
public record InterestRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 512) String image,
        String description,
        @NotBlank @Size(max = 50) String tag
) {
}
