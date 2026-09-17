function cleanText(value, max = 6000) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function readFieldValue(fieldElement) {
  const control = fieldElement.querySelector("input, textarea, select");
  if (!control) return cleanText(fieldElement.textContent);
  if (control.tagName === "SELECT") {
    return cleanText(control.selectedOptions?.[0]?.textContent || control.value);
  }
  return cleanText(control.value);
}

function fieldLabel(fieldElement) {
  return cleanText(
    fieldElement.querySelector("label")?.textContent ||
      fieldElement.querySelector(".file-field-label")?.textContent ||
      fieldElement.querySelector(".detail-card-title")?.textContent ||
      "Selected field",
    300,
  );
}

function cardValue(cardElement) {
  const copy = cardElement.cloneNode(true);
  copy.querySelectorAll("button, input, textarea, select, label, .file-field-actions, .file-entry-actions").forEach((node) => node.remove());
  return cleanText(copy.textContent, 8000);
}

export function getAiSelectionFromTarget(target) {
  if (!(target instanceof Element)) return null;

  const pdfPane = target.closest("[data-ai-pdf]");
  if (pdfPane && pdfPane.dataset.aiFileName) {
    return {
      type: "pdf",
      id: `pdf:${pdfPane.dataset.aiFileId || pdfPane.dataset.aiFileName}`,
      fileId: pdfPane.dataset.aiFileId || "",
      companyId: pdfPane.dataset.aiCompanyId || "",
      detailKey: pdfPane.dataset.aiDetailKey || "",
      field: pdfPane.dataset.aiField || "",
      name: pdfPane.dataset.aiFileName,
      mimeType: "application/pdf",
    };
  }

  const fileEntry = target.closest(".file-entry");
  if (fileEntry) {
    const fileName = fileEntry.dataset.aiFileName || cleanText(fileEntry.querySelector(".file-entry-name")?.textContent, 300);
    const mimeType = fileEntry.dataset.aiMimeType || "application/pdf";
    if (fileEntry.dataset.aiFileId && fileName) {
      return {
        type: "pdf",
        id: `pdf:${fileEntry.dataset.aiFileId}`,
        fileId: fileEntry.dataset.aiFileId,
        companyId: fileEntry.dataset.aiCompanyId,
        detailKey: fileEntry.dataset.aiDetailKey,
        field: fileEntry.dataset.aiField,
        name: fileName,
        mimeType,
      };
    }
  }

  const field = target.closest(".detail-field");
  if (field) {
    return {
      type: "element",
      id: `element:${fieldLabel(field)}:${cleanText(readFieldValue(field), 300)}`,
      fieldName: fieldLabel(field),
      fieldValue: readFieldValue(field),
      source: cleanText(field.closest(".detail-page")?.querySelector(".detail-eyebrow")?.textContent || "Details", 200),
    };
  }

  const moduleCard = target.closest(".company-module-card, .division-company-row, .pfccl-stat-button");
  if (moduleCard) {
    return {
      type: "element",
      id: `element:${cleanText(moduleCard.textContent, 500)}`,
      fieldName: "Navigation / summary item",
      fieldValue: cleanText(moduleCard.textContent, 2000),
      source: cleanText(moduleCard.closest(".detail-page")?.querySelector(".detail-eyebrow")?.textContent || "Details", 200),
    };
  }

  const card = target.closest(".detail-card");
  if (card) {
    const heading = cleanText(card.querySelector(".detail-card-title")?.textContent || "Selected section", 300);
    return {
      type: "element",
      id: `element:${heading}:${cardValue(card).slice(0, 250)}`,
      fieldName: heading,
      fieldValue: cardValue(card),
      source: cleanText(card.closest(".detail-page")?.querySelector(".detail-eyebrow")?.textContent || "Details", 200),
    };
  }

  const page = target.closest(".detail-page");
  if (page) {
    const heading = cleanText(page.querySelector(".detail-title")?.textContent || "Selected details", 300);
    return {
      type: "element",
      id: `element:page:${heading}`,
      fieldName: heading,
      fieldValue: cleanText(page.textContent, 10000),
      source: cleanText(page.querySelector(".detail-eyebrow")?.textContent || "Details", 200),
    };
  }

  return null;
}
