package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.NotificationDto;
import com.dthoughts.g4.moreno.service.NotificationService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class NotificationController {
	@Autowired
	private NotificationService notificationService;

	@GetMapping("/me")
	public ResponseEntity<?> me(@RequestParam Long userId) {
		try {
			List<NotificationDto> list = notificationService.listMine(userId);
			return ResponseEntity.ok(list);
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(error(e.getMessage()));
		}
	}

	@GetMapping("/me/unread-count")
	public ResponseEntity<?> unreadCount(@RequestParam Long userId) {
		try {
			long count = notificationService.unreadCount(userId);
			Map<String, Object> res = new HashMap<>();
			res.put("unreadCount", count);
			return ResponseEntity.ok(res);
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(error(e.getMessage()));
		}
	}

	@PostMapping("/me/read-all")
	public ResponseEntity<?> markAllRead(@RequestParam Long userId) {
		try {
			notificationService.markAllRead(userId);
			return ResponseEntity.noContent().build();
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(error(e.getMessage()));
		}
	}

	@PostMapping("/{id}/read")
	public ResponseEntity<?> markRead(@PathVariable Long id, @RequestParam Long userId) {
		try {
			notificationService.markRead(userId, id);
			return ResponseEntity.noContent().build();
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(error(e.getMessage()));
		}
	}

	private Map<String, String> error(String message) {
		Map<String, String> e = new HashMap<>();
		e.put("message", message == null ? "Request failed." : message);
		return e;
	}
}

