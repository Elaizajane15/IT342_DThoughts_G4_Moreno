package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.FollowStatusDto;
import com.dthoughts.g4.moreno.entity.Follow;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.FollowRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FollowService {
	@Autowired
	private FollowRepository followRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private NotificationService notificationService;

	@Transactional
	public FollowStatusDto toggleFollow(Long followerId, Long followingId) {
		if (followerId == null) throw new RuntimeException("followerId is required.");
		if (followingId == null) throw new RuntimeException("followingId is required.");
		if (followerId.equals(followingId)) throw new RuntimeException("You cannot follow yourself.");

		Optional<User> followerOpt = userRepository.findById(followerId);
		if (followerOpt.isEmpty()) throw new RuntimeException("User not found.");
		Optional<User> followingOpt = userRepository.findById(followingId);
		if (followingOpt.isEmpty()) throw new RuntimeException("User not found.");

		Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
		boolean created = existing.isEmpty();
		if (existing.isPresent()) {
			followRepository.delete(existing.get());
		} else {
			followRepository.save(new Follow(followerOpt.get(), followingOpt.get()));
		}

		if (created) {
			notificationService.notifyFollow(followerId, followingId);
		}

		return getFollowStatus(followerId, followingId);
	}

	@Transactional(readOnly = true)
	public FollowStatusDto getFollowStatus(Long followerId, Long followingId) {
		boolean following = followerId != null && followingId != null && followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
		long followerCount = followingId == null ? 0 : followRepository.countByFollowingId(followingId);
		long followingCount = followingId == null ? 0 : followRepository.countByFollowerId(followingId);
		return new FollowStatusDto(following, followerCount, followingCount);
	}
}
