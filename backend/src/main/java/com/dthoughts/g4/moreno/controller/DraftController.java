package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.DraftDto;
import com.dthoughts.g4.moreno.dto.SaveDraftRequest;
import com.dthoughts.g4.moreno.service.DraftService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drafts")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class DraftController {
	@Autowired
	private DraftService draftService;

	@PostMapping
	public ResponseEntity<?> save(@RequestBody SaveDraftRequest request) {
		try {
			DraftDto saved = draftService.save(request);
			return ResponseEntity.ok(saved);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping("/me")
	public ResponseEntity<?> me(@RequestParam Long userId) {
		try {
			DraftDto dto = draftService.getMyDraft(userId);
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.status(404).body(error);
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(@PathVariable Long id) {
		try {
			draftService.delete(id);
			return ResponseEntity.noContent().build();
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.status(404).body(error);
		}
	}
}
