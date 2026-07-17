package org.javaguru.eventservice.dto;

/**
 * Тег ивента для REST API.
 */
public record TagResponse(
        String id,
        String label
) {
}
