package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findTop200ByRecipientIdOrderByCreatedAtDesc(Long recipientId);
	long countByRecipientIdAndReadFalse(Long recipientId);

	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
	int markAllRead(@Param("recipientId") Long recipientId);

	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.recipient.id = :recipientId")
	int markRead(@Param("id") Long id, @Param("recipientId") Long recipientId);
}

