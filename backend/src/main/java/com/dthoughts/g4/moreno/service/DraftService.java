package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.DraftDto;
import com.dthoughts.g4.moreno.dto.SaveDraftRequest;
import com.dthoughts.g4.moreno.entity.Draft;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.DraftRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DraftService {
	private static final String STATUS_DRAFT = "draft";

	@Autowired
	private DraftRepository draftRepository;

	@Autowired
	private UserRepository userRepository;

	@Transactional
	public DraftDto save(SaveDraftRequest request) {
		if (request == null) throw new RuntimeException("Request is required.");
		if (request.getUserId() == null) throw new RuntimeException("userId is required.");

		String content = request.getContent() == null ? "" : request.getContent().trim();
		if (content.isEmpty()) throw new RuntimeException("content is required.");
		if (content.length() > 500) throw new RuntimeException("content must be 500 characters or less.");

		String title = request.getTitle();
		if (title != null) {
			title = title.trim();
			if (title.isEmpty()) title = null;
			if (title != null && title.length() > 200) title = title.substring(0, 200);
		}

		String mood = request.getMood();
		if (mood != null) {
			mood = mood.trim();
			if (mood.isEmpty()) mood = null;
			if (mood != null && mood.length() > 50) mood = mood.substring(0, 50);
		}

		String status = request.getStatus();
		status = status == null || status.isBlank() ? STATUS_DRAFT : status.trim().toLowerCase();

		Optional<User> userOpt = userRepository.findById(request.getUserId());
		if (userOpt.isEmpty()) throw new RuntimeException("User not found.");
		User user = userOpt.get();

		Optional<Draft> existing = draftRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(user.getId(), status);
		Draft saved;
		if (existing.isPresent()) {
			Draft d = existing.get();
			d.setTitle(title);
			d.setContent(content);
			d.setStatus(status);
			d.setMood(mood);
			saved = draftRepository.save(d);
		} else {
			saved = draftRepository.save(new Draft(user, title, content, status, mood));
		}

		return toDto(saved);
	}

	@Transactional(readOnly = true)
	public DraftDto getMyDraft(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		Optional<Draft> existing = draftRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(userId, STATUS_DRAFT);
		if (existing.isEmpty()) throw new RuntimeException("Draft not found.");
		return toDto(existing.get());
	}

	@Transactional
	public void delete(Long id) {
		if (id == null) throw new RuntimeException("id is required.");
		if (!draftRepository.existsById(id)) throw new RuntimeException("Draft not found.");
		draftRepository.deleteById(id);
	}

	private DraftDto toDto(Draft d) {
		return new DraftDto(
				d.getId(),
				d.getUser() == null ? null : d.getUser().getId(),
				d.getTitle(),
				d.getContent(),
				d.getStatus(),
				d.getMood(),
				d.getCreatedAt(),
				d.getUpdatedAt()
		);
	}
}
