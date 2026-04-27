package com.dthoughts.g4.moreno.user;

import com.dthoughts.g4.moreno.user.Follow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, Long> {
	Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
	boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
	long countByFollowingId(Long followingId);
	long countByFollowerId(Long followerId);
	List<Follow> findByFollowingId(Long followingId);
	List<Follow> findByFollowerId(Long followerId);
}
