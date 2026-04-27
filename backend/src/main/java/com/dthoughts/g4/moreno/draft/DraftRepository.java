package com.dthoughts.g4.moreno.draft;

import com.dthoughts.g4.moreno.draft.Draft;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DraftRepository extends JpaRepository<Draft, Long> {
	Optional<Draft> findFirstByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, String status);
}
