package org.javaguru.eventservice.client;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.config.UserServiceProperties;
import org.javaguru.eventservice.dto.UserSummaryResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * HTTP-клиент UserService для обогащения author/organizer.
 */
@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestClient.Builder restClientBuilder;
    private final UserServiceProperties properties;

    /**
     * Загружает пользователей по списку идентификаторов.
     *
     * @param userIds идентификаторы пользователей
     * @return map userId → summary
     */
    public Map<Long, UserSummaryResponse> findSummariesByIds(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<Long> distinctIds = userIds.stream().distinct().toList();
        RestClient client = restClientBuilder.baseUrl(properties.baseUrl()).build();
        List<UserServiceUser> users = client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users/by-ids")
                        .queryParam("ids", distinctIds)
                        .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        if (users == null || users.isEmpty()) {
            return Map.of();
        }
        return users.stream()
                .map(this::toSummary)
                .collect(Collectors.toMap(user -> Long.parseLong(user.id()), Function.identity()));
    }

    /**
     * Преобразует ответ UserService в DTO фронтенда.
     *
     * @param user данные UserService
     * @return summary для API
     */
    private UserSummaryResponse toSummary(UserServiceUser user) {
        return new UserSummaryResponse(
                String.valueOf(user.id()),
                user.name(),
                user.avatar(),
                user.level() != null ? user.level() : 0,
                user.rating()
        );
    }

    /**
     * Упрощённое представление пользователя из UserService.
     */
    private record UserServiceUser(
            Long id,
            String name,
            String avatar,
            Integer level,
            BigDecimal rating
    ) {
    }
}
