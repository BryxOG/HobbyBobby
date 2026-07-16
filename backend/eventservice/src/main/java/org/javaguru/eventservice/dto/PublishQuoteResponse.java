package org.javaguru.eventservice.dto;

/**
 * Котировка публикации ивента.
 */
public record PublishQuoteResponse(
        int amount,
        String currency,
        String label
) {
}
