package org.javaguru.gateway.config;

import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.ServerRequest;

/**
 * Прокидывает X-User-* в ServerRequest, который Gateway MVC реально проксирует downstream.
 */
@Component
public class UserContextBeforeFilter implements Function<ServerRequest, ServerRequest> {

    private final GatewayIdentityProperties identityProperties;

    public UserContextBeforeFilter(GatewayIdentityProperties identityProperties) {
        this.identityProperties = identityProperties;
    }

    /**
     * apply («применить») — добавляет identity-заголовки к запросу.
     */
    @Override
    public ServerRequest apply(ServerRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)) {
            return request;
        }

        Jwt jwt = jwtAuthentication.getToken();
        String userId = SecurityConfiguration.resolveUserId(jwt, identityProperties.userIdByUsername());
        String username = preferredUsername(jwt);
        String roles = jwtAuthentication.getAuthorities().stream()
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
    }

    private static String preferredUsername(Jwt jwt) {
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        return preferredUsername != null ? preferredUsername : jwt.getSubject();
    }
}
