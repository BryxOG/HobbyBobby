package org.javaguru.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import java.util.function.Function;
import java.util.stream.Collectors;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.rewritePath;
import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
class RouteConfiguration {

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes(
            GatewayRouteProperties properties,
            @Value("${gateway.security.fallback-user-id:}") String fallbackUserId
    ) {
        return route("event-service")
                .route(path("/api/events", "/api/events/**", "/api/tags", "/api/tags/**", "/api/map", "/api/map/**",
                        "/api/chats", "/api/chats/**"), http())
                .before(uri(properties.eventServiceUrl()))
                .before(userContextHeaders(fallbackUserId))
                .before(rewritePath("/api/(?<segment>events|tags|map|chats)(?<remaining>/?.*)",
                        "/eventservice/api/${segment}${remaining}"))
                .build()
                .and(route("user-service")
                        .route(path("/api/users", "/api/users/**"), http())
                        .before(uri(properties.userServiceUrl()))
                        .before(userContextHeaders(fallbackUserId))
                        .before(rewritePath("/api/users(?<remaining>/?.*)", "/userservice/api/users${remaining}"))
                        .build())
                .and(route("interest-service")
                        .route(path("/api/interests", "/api/interests/**"), http())
                        .before(uri(properties.userServiceUrl()))
                        .before(userContextHeaders(fallbackUserId))
                        .build());
    }

    private static Function<ServerRequest, ServerRequest> userContextHeaders(String fallbackUserId) {
        return request -> {
            if (!(SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken authentication)) {
                return request;
            }

            Jwt jwt = authentication.getToken();
            String applicationUserId = jwt.getClaimAsString("hobbybobby_user_id");
            String userId = applicationUserId != null ? applicationUserId : fallbackUserId.isBlank() ? jwt.getSubject() : fallbackUserId;
            String username = jwt.getClaimAsString("preferred_username") != null
                    ? jwt.getClaimAsString("preferred_username")
                    : authentication.getName();
            String roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(authority -> authority.startsWith("ROLE_"))
                    .map(authority -> authority.substring("ROLE_".length()))
                    .collect(Collectors.joining(","));

            return ServerRequest.from(request)
                    .headers(headers -> {
                        headers.set("X-User-Id", userId);
                        headers.set("X-User-Name", username);
                        headers.set("X-User-Roles", roles);
                    })
                    .build();
        };
    }
}
