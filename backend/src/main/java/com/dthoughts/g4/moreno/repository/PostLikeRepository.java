package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.PostLike;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
	Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
	long countByPostId(Long postId);
	boolean existsByPostIdAndUserId(Long postId, Long userId);
	long countByPostUserId(Long userId);
	List<PostLike> findByUserIdOrderByCreatedAtDesc(Long userId);
}
