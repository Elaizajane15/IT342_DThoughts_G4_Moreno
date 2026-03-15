package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.NotificationDto;
import com.dthoughts.g4.moreno.entity.Notification;
import com.dthoughts.g4.moreno.entity.Post;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.NotificationRepository;
import com.dthoughts.g4.moreno.repository.PostRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
	@Autowired
	private NotificationRepository notificationRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PostRepository postRepository;

	@Transactional(readOnly = true)
	public List<NotificationDto> listMine(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");
		return notificationRepository.findTop200ByRecipientIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");
		return notificationRepository.countByRecipientIdAndReadFalse(userId);
	}

	@Transactional
	public void markAllRead(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");
		notificationRepository.markAllRead(userId);
	}

	@Transactional
	public void markRead(Long userId, Long notificationId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (notificationId == null) throw new RuntimeException("notificationId is required.");
		notificationRepository.markRead(notificationId, userId);
	}

	@Transactional
	public void notifyFollow(Long followerId, Long followedId) {
		if (followerId == null || followedId == null) return;
		if (followerId.equals(followedId)) return;
		Optional<User> recipientOpt = userRepository.findById(followedId);
		Optional<User> actorOpt = userRepository.findById(followerId);
		if (recipientOpt.isEmpty() || actorOpt.isEmpty()) return;
		notificationRepository.save(new Notification(recipientOpt.get(), actorOpt.get(), null, "FOLLOW", null));
	}

	@Transactional
	public void notifyLike(Long actorId, Long postId) {
		if (actorId == null || postId == null) return;
		Optional<User> actorOpt = userRepository.findById(actorId);
		Optional<Post> postOpt = postRepository.findById(postId);
		if (actorOpt.isEmpty() || postOpt.isEmpty()) return;
		Post post = postOpt.get();
		Long ownerId = post.getUser() == null ? null : post.getUser().getId();
		if (ownerId == null) return;
		if (actorId.equals(ownerId)) return;
		notificationRepository.save(new Notification(post.getUser(), actorOpt.get(), post, "LIKE", null));
	}

	@Transactional
	public void notifyComment(Long actorId, Long postId) {
		if (actorId == null || postId == null) return;
		Optional<User> actorOpt = userRepository.findById(actorId);
		Optional<Post> postOpt = postRepository.findById(postId);
		if (actorOpt.isEmpty() || postOpt.isEmpty()) return;
		Post post = postOpt.get();
		Long ownerId = post.getUser() == null ? null : post.getUser().getId();
		if (ownerId == null) return;
		if (actorId.equals(ownerId)) return;
		notificationRepository.save(new Notification(post.getUser(), actorOpt.get(), post, "COMMENT", null));
	}

	@Transactional
	public void notifyNewPostToUser(Long recipientId, Long authorId, Long postId) {
		if (recipientId == null || authorId == null || postId == null) return;
		if (recipientId.equals(authorId)) return;
		Optional<User> recipientOpt = userRepository.findById(recipientId);
		Optional<User> actorOpt = userRepository.findById(authorId);
		Optional<Post> postOpt = postRepository.findById(postId);
		if (recipientOpt.isEmpty() || actorOpt.isEmpty() || postOpt.isEmpty()) return;
		notificationRepository.save(new Notification(recipientOpt.get(), actorOpt.get(), postOpt.get(), "POST", null));
	}

	private NotificationDto toDto(Notification n) {
		String actorName = null;
		String actorAvatar = null;
		if (n.getActor() != null) {
			String first = n.getActor().getFirstName() == null ? "" : n.getActor().getFirstName().trim();
			String last = n.getActor().getLastName() == null ? "" : n.getActor().getLastName().trim();
			String joined = (first + " " + last).trim();
			actorName = joined.isEmpty() ? n.getActor().getEmail() : joined;
			actorAvatar = n.getActor().getAvatarUrl();
		}

		Long refPostId = n.getPost() == null ? null : n.getPost().getId();
		String postPreview = null;
		if (n.getPost() != null) {
			String content = n.getPost().getContent();
			if (content != null) {
				String trimmed = content.trim();
				postPreview = trimmed.isEmpty() ? null : trimmed;
			}
		}

		return new NotificationDto(
				n.getId(),
				n.getType(),
				n.isRead(),
				actorName,
				actorAvatar,
				n.getMessage(),
				postPreview,
				refPostId,
				n.getCreatedAt()
		);
	}
}

