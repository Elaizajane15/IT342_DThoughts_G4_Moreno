package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.PostSave;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostSaveRepository extends JpaRepository<PostSave, Long> {
	Optional<PostSave> findByPostIdAndUserId(Long postId, Long userId);
	boolean existsByPostIdAndUserId(Long postId, Long userId);
	long countByPostId(Long postId);
	List<PostSave> findByUserIdOrderByCreatedAtDesc(Long userId);
}
