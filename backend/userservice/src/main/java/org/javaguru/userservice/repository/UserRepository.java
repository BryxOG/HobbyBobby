package org.javaguru.userservice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.javaguru.userservice.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий пользователей.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Проверяет, существует ли пользователь с указанным email.
     *
     * @param email адрес электронной почты
     * @return true, если запись найдена
     */
    boolean existsByEmail(String email);

    /**
     * Проверяет, существует ли другой пользователь с тем же email.
     *
     * @param email адрес электронной почты
     * @param id    идентификатор текущего пользователя
     * @return true, если конфликтующая запись найдена
     */
    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Возвращает всех пользователей вместе с интересами.
     *
     * @return список пользователей
     */
    @EntityGraph(attributePaths = "interests")
    @Override
    List<User> findAll();

    /**
     * Возвращает пользователя вместе с интересами.
     *
     * @param id идентификатор пользователя
     * @return пользователь, если найден
     */
    @EntityGraph(attributePaths = "interests")
    @Override
    Optional<User> findById(Long id);

    /**
     * Возвращает пользователя по email без учёта регистра.
     *
     * @param email адрес электронной почты
     * @return пользователь, если найден
     */
    @EntityGraph(attributePaths = "interests")
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Возвращает пользователей по списку идентификаторов вместе с интересами.
     *
     * @param ids идентификаторы пользователей
     * @return найденные пользователи
     */
    @EntityGraph(attributePaths = "interests")
    List<User> findAllByIdIn(Collection<Long> ids);
}
