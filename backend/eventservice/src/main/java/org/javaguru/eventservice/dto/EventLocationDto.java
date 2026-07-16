package org.javaguru.eventservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Геолокация ивента для REST API.
 */
public record EventLocationDto(
        @NotNull Double lat,
        @NotNull Double lng,
        @NotBlank String address
) {
}
