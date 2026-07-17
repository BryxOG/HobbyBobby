package org.javaguru.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gateway.routes")
public record GatewayRouteProperties(
        String eventServiceUrl,
        String userServiceUrl
) {
}
