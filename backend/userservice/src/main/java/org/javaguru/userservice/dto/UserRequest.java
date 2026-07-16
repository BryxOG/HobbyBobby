package org.javaguru.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Запрос на создание или обновление пользователя.
 */
public record UserRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 512) String avatar,
        @NotNull @Min(1) @Max(100) Integer level,
        @Min(0) @Max(5) BigDecimal rating,
        @Size(max = 100) String city,
        String about
) {
}
