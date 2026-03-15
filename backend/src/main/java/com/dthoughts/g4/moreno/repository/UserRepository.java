package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPasswordResetTokenHash(String passwordResetTokenHash);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);

	Page<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
			String firstName,
			String lastName,
			String email,
			Pageable pageable
	);
}
