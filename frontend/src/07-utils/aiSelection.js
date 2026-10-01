function cleanText(value, max = 6000) {
  return String(value ?? "").replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readFieldValue(fieldElement) {
  const controls = [...fieldElement.querySelectorAll("input, textarea, select")];
  if (!controls.length) return cleanText(fieldElement.textContent, 6000);
  return controls.map((control) => {
    if (control.tagName === "SELECT") {
      const values = [...(control.selectedOptions || [])].map((option) => option.textContent || option.value);
      return cleanText(values.join(", "), 2000);
    }
    if (control.type === "checkbox" || control.type === "radio") {
      return `${control.checked ? "Selected" : "Not selected"}`;
    }
    if (control.type === "file") {
      return cleanText([...control.files].map((file) => file.name).join(", "), 2000);
    }
    return cleanText(control.value, 1000);
  }).filter(Boolean).join(" | ") || "(empty)";
}

function fieldLabel(fieldElement) {
  return cleanText(
    fieldElement.dataset.aiFieldName ||
      fieldElement.querySelector("label")?.textContent ||
      fieldElement.querySelector(".document-field-label")?.textContent ||
      fieldElement.querySelector(".detail-card-title")?.textContent ||
      "Selected field",
    300,
  );
}

function sourceName(element) {
  return cleanText(element.closest(".detail-page")?.querySelector(".detail-eyebrow")?.textContent || "Details", 200);
}

export function getAiSelectionFromTarget(target) {
  if (!(target instanceof Element)) return null;
  if (target.closest(".file-icon-button.danger, .meeting-delete-button, .danger-button")) return null;

  const pdfEntry = target.closest("[data-ai-pdf-file='true'], [data-ai-pdf]");
  if (pdfEntry?.dataset.aiFileName) {
    return {
      type: "pdf",
      id: `pdf:${pdfEntry.dataset.aiFileId || pdfEntry.dataset.aiFileName}`,
      fileId: pdfEntry.dataset.aiFileId || "",
      companyId: pdfEntry.dataset.aiCompanyId || "",
      detailKey: pdfEntry.dataset.aiDetailKey || "",
      field: pdfEntry.dataset.aiField || "",
      name: pdfEntry.dataset.aiFileName,
      mimeType: pdfEntry.dataset.aiMimeType || "application/pdf",
    };
  }

  const fileField = target.closest("[data-ai-file-field='true']");
  if (fileField) {
    return {
      type: "element",
      id: `field:${fileField.dataset.aiCompanyId || ""}:${fileField.dataset.aiDetailKey || ""}:${fileField.dataset.aiFieldPath || ""}`,
      fieldName: cleanText(fileField.dataset.aiFieldName || "File field", 300),
      fieldValue: cleanText([...fileField.querySelectorAll(".document-entry-name-text")].map((el) => el.textContent).join(" | ") || "No files", 6000),
      source: sourceName(fileField),
    };
  }

  const field =
    target.closest('.detail-field, .form-field, [data-ai-field="true"], .meeting-input-block') ||
    (target.matches("input, textarea, select") ? target.parentElement?.closest(".detail-field, .form-field") : null);

  if (field) {
    const identity = field.dataset.aiFieldPath || fieldLabel(field);
    return {
      type: "element",
      id: `element:${field.dataset.aiCompanyId || ""}:${field.dataset.aiDetailKey || ""}:${identity}`,
      fieldName: fieldLabel(field),
      fieldValue: readFieldValue(field),
      source: sourceName(field),
      companyId: field.dataset.aiCompanyId || undefined,
      detailKey: field.dataset.aiDetailKey || undefined,
      fieldPath: field.dataset.aiFieldPath || undefined,
    };
  }

  const section = target.closest("[data-ai-section='true']");
  if (section?.dataset.aiCompanyId && section.dataset.aiDetailKey && !target.closest("[data-ai-field], [data-ai-file-field], .company-module-card")) {
    return {
      type: "section",
      id: `section:${section.dataset.aiCompanyId}:${section.dataset.aiDetailKey}`,
      scope: "sub-detail",
      companyId: section.dataset.aiCompanyId,
      detailKey: section.dataset.aiDetailKey,
      fieldName: section.dataset.aiSectionName || section.dataset.aiDetailKey,
    };
  }

  const moduleCard = target.closest(".company-module-card, .division-company-row, .pfccl-stat-button");
  if (moduleCard) {
    return {
      type: "element",
      id: `element:${cleanText(moduleCard.textContent, 500)}`,
      fieldName: "Navigation / summary item",
      fieldValue: cleanText(moduleCard.textContent, 2000),
      source: sourceName(moduleCard),
    };
  }

  return null;
}

export function getCompanyIdFromNodeId(nodeId, detailKeys = []) {
  if (!nodeId || nodeId === "pfccl" || nodeId === "umpp" || nodeId === "itp") return null;
  const suffix = detailKeys.find((key) => nodeId.endsWith(`-${key}`));
  return suffix ? nodeId.slice(0, -(suffix.length + 1)) : nodeId;
}

export function getDetailKeyFromNodeId(nodeId, detailKeys = []) {
  if (!nodeId) return null;
  const suffix = detailKeys.find((key) => nodeId.endsWith(`-${key}`));
  return suffix || null;
}
