package org.javaguru.userservice.repository;

import org.javaguru.userservice.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий интересов.
 */
public interface InterestRepository extends JpaRepository<Interest, Long> {
}
