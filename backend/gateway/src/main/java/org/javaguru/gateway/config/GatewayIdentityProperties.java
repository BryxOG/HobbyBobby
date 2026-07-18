package org.javaguru.gateway.config;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Маппинг identity из JWT (Keycloak) на числовой domain user id.
 */
@ConfigurationProperties("gateway.identity")
public record GatewayIdentityProperties(
        Map<String, String> userIdByUsername
) {
    public GatewayIdentityProperties {
        if (userIdByUsername == null) {
            userIdByUsername = Map.of();
        }
    }
}
