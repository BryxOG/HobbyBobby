package org.javaguru.userservice.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Ответ с данными пользователя.
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        String avatar,
        Integer level,
        BigDecimal rating,
        String city,
        String about,
        List<InterestResponse> interests
) {
}
