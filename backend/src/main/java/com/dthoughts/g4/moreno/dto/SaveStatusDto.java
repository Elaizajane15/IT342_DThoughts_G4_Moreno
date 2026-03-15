package com.dthoughts.g4.moreno.dto;

public class SaveStatusDto {
	private boolean saved;
	private long saveCount;

	public SaveStatusDto() {}

	public SaveStatusDto(boolean saved, long saveCount) {
		this.saved = saved;
		this.saveCount = saveCount;
	}

	public boolean isSaved() {
		return saved;
	}

	public void setSaved(boolean saved) {
		this.saved = saved;
	}

	public long getSaveCount() {
		return saveCount;
	}

	public void setSaveCount(long saveCount) {
		this.saveCount = saveCount;
	}
}
