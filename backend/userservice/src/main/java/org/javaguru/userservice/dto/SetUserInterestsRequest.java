package org.javaguru.userservice.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Запрос на замену списка интересов пользователя.
 */
public record SetUserInterestsRequest(
        @NotNull List<@NotNull Long> interestIds
) {
}
