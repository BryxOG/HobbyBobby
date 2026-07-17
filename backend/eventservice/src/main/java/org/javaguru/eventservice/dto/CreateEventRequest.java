package org.javaguru.eventservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Запрос на создание ивента.
 */
public record CreateEventRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 64) String activityId,
        @NotBlank String description,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt,
        @NotNull @Valid EventLocationDto location,
        @Min(1) int capacity,
        @NotNull List<@NotBlank String> tagIds
) {
}
