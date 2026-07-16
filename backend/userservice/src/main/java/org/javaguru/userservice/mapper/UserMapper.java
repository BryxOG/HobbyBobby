package org.javaguru.userservice.mapper;

import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.userservice.dto.CreateUserRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.dto.UserRequest;
import org.javaguru.userservice.dto.UserResponse;
import org.javaguru.userservice.entity.Interest;
import org.javaguru.userservice.entity.User;
import org.springframework.stereotype.Component;

/**
 * Преобразование сущностей пользователя в DTO и обратно.
 */
@Component
@RequiredArgsConstructor
public class UserMapper {

    private final InterestMapper interestMapper;

    /**
     * Создаёт новую сущность пользователя из запроса регистрации.
     *
     * @param request входные данные
     * @return сущность без идентификатора
     */
    public User toEntity(CreateUserRequest request) {
        return User.builder()
                .name(request.name())
                .email(request.email())
                .city(request.city())
                .about(request.about())
                .level(1)
                .rating(null)
                .build();
    }

    /**
     * Создаёт новую сущность пользователя из запроса.
     *
     * @param request входные данные
     * @return сущность без идентификатора
     */
    public User toEntity(UserRequest request) {
        return User.builder()
                .name(request.name())
                .email(request.email())
                .avatar(request.avatar())
                .level(request.level())
                .rating(request.rating())
                .city(request.city())
                .about(request.about())
                .build();
    }

    /**
     * Обновляет существующую сущность данными из запроса.
     *
     * @param user    сущность для обновления
     * @param request входные данные
     */
    public void updateEntity(User user, UserRequest request) {
        user.setName(request.name());
        user.setEmail(request.email());
        user.setAvatar(request.avatar());
        user.setLevel(request.level());
        user.setRating(request.rating());
        user.setCity(request.city());
        user.setAbout(request.about());
    }

    /**
     * Преобразует сущность в ответ API.
     *
     * @param user сущность пользователя
     * @return DTO ответа
     */
    public UserResponse toResponse(User user) {
        List<InterestResponse> interests = user.getInterests().stream()
                .sorted(Comparator.comparing(Interest::getId))
                .map(interestMapper::toResponse)
                .toList();

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatar(),
                user.getLevel(),
                user.getRating(),
                user.getCity(),
                user.getAbout(),
                interests
        );
    }
}
