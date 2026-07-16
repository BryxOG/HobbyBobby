package org.javaguru.userservice.dto;

/**
 * Ответ с данными интереса.
 */
public record InterestResponse(
        Long id,
        String name,
        String image,
        String description,
        String tag
) {
}
