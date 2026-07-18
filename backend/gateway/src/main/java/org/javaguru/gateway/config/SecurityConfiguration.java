package org.javaguru.gateway.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Enumeration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
class SecurityConfiguration {

    static final String HOBBYBOBBY_USER_ID_CLAIM = "hobbybobby_user_id";

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter,
            UserContextHeaderFilter userContextHeaderFilter
    ) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {
                })
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                )
                .addFilterAfter(userContextHeaderFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${gateway.cors.allowed-origins}") List<String> allowedOrigins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, "X-Request-Id"));
        configuration.setExposedHeaders(List.of("X-Request-Id"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> new JwtAuthenticationToken(jwt, extractAuthorities(jwt), principalName(jwt));
    }

    @Bean
    UserContextHeaderFilter userContextHeaderFilter(GatewayIdentityProperties identityProperties) {
        return new UserContextHeaderFilter(identityProperties);
    }

    private static String principalName(Jwt jwt) {
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        return preferredUsername != null ? preferredUsername : jwt.getSubject();
    }

    /**
     * Резолвит числовой domain user id (resolveUserId — «разрешить id пользователя»).
     * Порядок: claim hobbybobby_user_id → map по preferred_username → numeric subject.
     */
    static String resolveUserId(Jwt jwt, Map<String, String> userIdByUsername) {
        String fromClaim = claimAsSingleString(jwt, HOBBYBOBBY_USER_ID_CLAIM);
        if (isNumericUserId(fromClaim)) {
            return fromClaim;
        }

        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (preferredUsername != null) {
            String mapped = userIdByUsername.get(preferredUsername);
            if (isNumericUserId(mapped)) {
                return mapped;
            }
        }

        String subject = jwt.getSubject();
        if (isNumericUserId(subject)) {
            return subject;
        }
        return subject;
    }

    private static String claimAsSingleString(Jwt jwt, String claimName) {
        Object value = jwt.getClaim(claimName);
        if (value instanceof String stringValue) {
            return stringValue;
        }
        if (value instanceof Collection<?> collection && !collection.isEmpty()) {
            Object first = collection.iterator().next();
            return first == null ? null : first.toString();
        }
        if (value instanceof Number number) {
            return Long.toString(number.longValue());
        }
        return null;
    }

    private static boolean isNumericUserId(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        for (int index = 0; index < value.length(); index++) {
            if (!Character.isDigit(value.charAt(index))) {
                return false;
            }
        }
        return true;
    }

    private static Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        addRealmRoles(jwt, authorities);
        addClientRoles(jwt, authorities);
        addScopes(jwt, authorities);
        return authorities;
    }

    private static void addRealmRoles(Jwt jwt, Set<GrantedAuthority> authorities) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return;
        }
        addRoles(realmAccess.get("roles"), authorities);
    }

    private static void addClientRoles(Jwt jwt, Set<GrantedAuthority> authorities) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess == null) {
            return;
        }
        resourceAccess.values().stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(clientAccess -> clientAccess.get("roles"))
                .forEach(roles -> addRoles(roles, authorities));
    }

    private static void addRoles(Object roles, Set<GrantedAuthority> authorities) {
        if (!(roles instanceof Collection<?> roleCollection)) {
            return;
        }
        roleCollection.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(role -> "ROLE_" + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .forEach(authorities::add);
    }

    private static void addScopes(Jwt jwt, Set<GrantedAuthority> authorities) {
        String scope = jwt.getClaimAsString("scope");
        if (scope == null || scope.isBlank()) {
            return;
        }
        for (String value : scope.split(" ")) {
            if (!value.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("SCOPE_" + value));
            }
        }
    }

    static class UserContextHeaderFilter extends OncePerRequestFilter {

        private final GatewayIdentityProperties identityProperties;

        UserContextHeaderFilter(GatewayIdentityProperties identityProperties) {
            this.identityProperties = identityProperties;
        }

        @Override
        protected void doFilterInternal(
                HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain
        ) throws ServletException, IOException {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
                filterChain.doFilter(
                        new UserContextRequestWrapper(request, jwtAuthentication, identityProperties),
                        response
                );
                return;
            }
            filterChain.doFilter(request, response);
        }
    }

    private static class UserContextRequestWrapper extends HttpServletRequestWrapper {
        private final String userId;
        private final String username;
        private final String roles;

        UserContextRequestWrapper(
                HttpServletRequest request,
                JwtAuthenticationToken authentication,
                GatewayIdentityProperties identityProperties
        ) {
            super(request);
            Jwt jwt = authentication.getToken();
            this.userId = resolveUserId(jwt, identityProperties.userIdByUsername());
            this.username = principalName(jwt);
            this.roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(authority -> authority.startsWith("ROLE_"))
                    .map(authority -> authority.substring("ROLE_".length()))
                    .collect(Collectors.joining(","));
        }

        @Override
        public String getHeader(String name) {
            return switch (name) {
                case "X-User-Id" -> userId;
                case "X-User-Name" -> username;
                case "X-User-Roles" -> roles;
                default -> super.getHeader(name);
            };
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            String value = getHeader(name);
            if (value == null) {
                return Collections.emptyEnumeration();
            }
            List<String> values = new ArrayList<>();
            values.add(value);
            return Collections.enumeration(values);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            names.add("X-User-Id");
            names.add("X-User-Name");
            names.add("X-User-Roles");
            return Collections.enumeration(names);
        }
    }
}
