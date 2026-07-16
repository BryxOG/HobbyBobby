package org.javaguru.userservice.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.javaguru.userservice.dto.CreateUserRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.dto.UserRequest;
import org.javaguru.userservice.dto.UserResponse;
import org.javaguru.userservice.entity.Interest;
import org.javaguru.userservice.entity.User;
import org.javaguru.userservice.exception.ConflictException;
import org.javaguru.userservice.exception.ResourceNotFoundException;
import org.javaguru.userservice.mapper.InterestMapper;
import org.javaguru.userservice.mapper.UserMapper;
import org.javaguru.userservice.repository.InterestRepository;
import org.javaguru.userservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Сервис CRUD-операций над пользователями.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final InterestRepository interestRepository;
    private final UserMapper userMapper;
    private final InterestMapper interestMapper;

    /**
     * Возвращает всех пользователей.
     *
     * @return список пользователей
     */
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    /**
     * Возвращает пользователя по идентификатору.
     *
     * @param id идентификатор пользователя
     * @return данные пользователя
     */
    public UserResponse findById(Long id) {
        return userMapper.toResponse(getUserOrThrow(id));
    }

    /**
     * Возвращает пользователя по email.
     *
     * @param email адрес электронной почты
     * @return данные пользователя
     */
    public UserResponse findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim())
                .map(userMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Пользователь с email=" + email + " не найден"));
    }

    /**
     * Возвращает интересы пользователя.
     *
     * @param id идентификатор пользователя
     * @return список интересов
     */
    public List<InterestResponse> findInterests(Long id) {
        return getUserOrThrow(id).getInterests().stream()
                .map(interestMapper::toResponse)
                .toList();
    }

    /**
     * Заменяет список интересов пользователя.
     *
     * @param id           идентификатор пользователя
     * @param interestIds  идентификаторы интересов
     * @return обновлённый пользователь
     */
    @Transactional
    public UserResponse setInterests(Long id, List<Long> interestIds) {
        User user = getUserOrThrow(id);
        Set<Interest> interests = resolveInterests(interestIds);
        user.getInterests().clear();
        user.getInterests().addAll(interests);
        return userMapper.toResponse(user);
    }

    /**
     * Создаёт нового пользователя вместе с интересами.
     *
     * @param request входные данные регистрации
     * @return созданный пользователь
     */
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Пользователь с email " + request.email() + " уже существует");
        }
        User user = userMapper.toEntity(request);
        user.getInterests().addAll(resolveInterests(request.interestIds()));
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    /**
     * Создаёт нового пользователя из полного запроса (админский сценарий).
     *
     * @param request входные данные
     * @return созданный пользователь
     */
    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Пользователь с email " + request.email() + " уже существует");
        }
        User saved = userRepository.save(userMapper.toEntity(request));
        return userMapper.toResponse(saved);
    }

    /**
     * Обновляет существующего пользователя.
     *
     * @param id      идентификатор пользователя
     * @param request входные данные
     * @return обновлённые данные
     */
    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = getUserOrThrow(id);
        if (userRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new ConflictException("Пользователь с email " + request.email() + " уже существует");
        }
        userMapper.updateEntity(user, request);
        return userMapper.toResponse(user);
    }

    /**
     * Удаляет пользователя по идентификатору.
     *
     * @param id идентификатор пользователя
     */
    @Transactional
    public void delete(Long id) {
        User user = getUserOrThrow(id);
        userRepository.delete(user);
    }

    /**
     * Загружает пользователя или выбрасывает исключение, если не найден.
     *
     * @param id идентификатор пользователя
     * @return сущность пользователя
     */
    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с id=" + id + " не найден"));
    }

    /**
     * Загружает интересы по идентификаторам и проверяет, что все найдены.
     *
     * @param interestIds идентификаторы интересов
     * @return набор сущностей интересов
     */
    private Set<Interest> resolveInterests(List<Long> interestIds) {
        List<Long> distinctIds = interestIds.stream().distinct().toList();
        List<Interest> found = interestRepository.findAllById(distinctIds);
        if (found.size() != distinctIds.size()) {
            Set<Long> foundIds = found.stream()
                    .map(Interest::getId)
                    .collect(Collectors.toSet());
            List<Long> missingIds = distinctIds.stream()
                    .filter(interestId -> !foundIds.contains(interestId))
                    .toList();
            throw new ResourceNotFoundException("Интересы не найдены: " + missingIds);
        }
        return new HashSet<>(found);
    }
}
