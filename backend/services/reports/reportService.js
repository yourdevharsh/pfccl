import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { config } from "../../config.js";
import { getPrisma } from "../prisma.js";
import { getGeminiClient, getGroqClient } from "../ai/aiProviders.js";

const MAX_PROMPT_CHARS = 6000;
const MAX_ROWS = 1000;
const MAX_COLUMNS = 16;

// Keep this prompt deliberately factual. The model has no write access and the
// query is independently validated and executed in a read-only transaction.
const DATABASE_SCHEMA = `PostgreSQL schema (quoted Prisma table/column names):
"Division"(id text PK, name text, "createdAt" timestamptz, "updatedAt" timestamptz)
"Company"(id text PK, name text, "incorporationDate" date, "divisionId" text FK -> "Division".id, status text, "meetingProfile" text, "createdAt" timestamptz, "updatedAt" timestamptz)
"CompanyDetail"(id text PK, "companyId" text FK -> "Company".id, "detailKey" text, data jsonb, "createdAt" timestamptz, "updatedAt" timestamptz). detailKey values: master-data, meetings, filings, transfer, certificates, miscellaneous. The contents of data are user-entered JSON and may be accessed with PostgreSQL jsonb operators.
"StoredFile"(id text PK, "companyId" text FK -> "Company".id, "detailKey" text, "fieldPath" text, "originalName" text, "physicalName" text, "mimeType" text, size integer, "createdAt" timestamptz, "updatedAt" timestamptz)
"Meeting"(id text PK, "companyId" text FK -> "Company".id, type text, "meetingNumber" text nullable, "scheduledDate" date nullable, "heldDate" date nullable, status text, "earlyConducted" boolean, "noticeSentDate" date nullable, "agendaSentDate" date nullable, "attendanceDate" date nullable, "minutesCirculatedDate" date nullable, "commentsReceivedDate" date nullable, "finalMinutesDate" date nullable, "minutesSignedDate" date nullable, "signedMinutesCirculatedDate" date nullable, notes text nullable, "createdAt" timestamptz, "updatedAt" timestamptz).
Use only these tables. Join Company to Division with c."divisionId" = d.id; use c.id with the other companyId columns.`;

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function parseJson(text, message) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw badRequest(message);
  }
}

function validateSelect(sql) {
  const normalized = String(sql || "").trim().replace(/;\s*$/, "");
  if (!normalized) throw badRequest("The report planner did not return a query.");
  if (normalized.length > 20000) throw badRequest("The generated query is too large.");
  if (!/^(select|with)\b/i.test(normalized)) throw badRequest("Only a SELECT query can be used for a report.");
  if (/;|--|\/\*|\*\/|\b(insert|update|delete|drop|alter|create|grant|revoke|copy|call|do|execute|prepare|deallocate|vacuum|analyze|truncate|merge|into|set|show|pg_sleep|for\s+(update|share)|pg_read_file|pg_catalog|information_schema)\b/i.test(normalized)) {
    throw badRequest("The generated query contains an unsupported operation.");
  }
  return normalized;
}

async function askModel(provider, systemInstruction, input) {
  if (provider === "groq") {
    const client = getGroqClient();
    if (!client) throw Object.assign(new Error("Groq is not configured."), { status: 503 });
    const response = await client.chat.completions.create({
      model: config.groqModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: input }],
    });
    return response.choices?.[0]?.message?.content || "";
  }
  if (provider === "gemini") {
    const client = getGeminiClient();
    if (!client) throw Object.assign(new Error("Gemini is not configured."), { status: 503 });
    const response = await client.interactions.create({
      model: config.geminiModel,
      system_instruction: systemInstruction,
      input,
      store: false,
      response_format: { type: "text", mime_type: "application/json" },
    });
    return response.output_text || "";
  }
  throw badRequest("Unsupported AI provider.");
}

async function fetchRows(sql) {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '10000'");
    const result = await tx.$queryRawUnsafe(
      `SELECT * FROM (${sql}) AS "reportResult" LIMIT ${MAX_ROWS}`,
    );
    return Array.isArray(result) ? result : [];
  });
}

function asCell(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return safeJson(value);
  return String(value);
}

function safeJson(value) {
  return JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

function normalizePlan(rawPlan, rows) {
  const available = new Set(Object.keys(rows[0] || {}));
  const columns = Array.isArray(rawPlan.columns) ? rawPlan.columns : [];
  const selected = columns
    .filter((column) => available.has(column?.key))
    .slice(0, MAX_COLUMNS)
    .map((column) => ({ key: column.key, label: String(column.label || column.key).slice(0, 80) }));
  if (!selected.length) {
    throw badRequest("The report formatter did not select usable report columns.");
  }
  return {
    title: String(rawPlan.title || "").trim().slice(0, 160),
    orientation: rawPlan.orientation === "landscape" ? "landscape" : "portrait",
    columns: selected,
  };
}

function buildDocument(plan, rows) {
  const widths = Math.max(1, Math.floor(100 / Math.max(plan.columns.length, 1)));
  const header = new TableRow({ children: plan.columns.map((column) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: column.label, bold: true })] })], width: { size: widths, type: WidthType.PERCENTAGE } })) });
  const body = rows.map((row) => new TableRow({ children: plan.columns.map((column) => new TableCell({ children: [new Paragraph(asCell(row[column.key]).slice(0, 5000))], width: { size: widths, type: WidthType.PERCENTAGE } })) }));
  const children = [];
  if (plan.title) children.push(new Paragraph({ children: [new TextRun({ text: plan.title, bold: true, size: 28 })], spacing: { after: 220 } }));
  children.push(new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } }));
  return new Document({ sections: [{ properties: plan.orientation === "landscape" ? { page: { size: { orientation: "landscape" } } } : {}, children }] });
}

export async function createAiReport({ provider, prompt }) {
  const request = String(prompt || "").trim().slice(0, MAX_PROMPT_CHARS);
  if (!request) throw badRequest("Describe the report you want to create.");

  const queryText = await askModel(provider,
    `You translate report requests into exactly one safe PostgreSQL SELECT query. Return JSON only: {"sql":"..."}. ${DATABASE_SCHEMA}\nReturn only columns needed by the request. Never use SELECT *, never modify data, never include comments, and add LIMIT ${MAX_ROWS}.`,
    `Report request: ${request}`);
  const { sql } = parseJson(queryText, "The report planner returned an invalid query response.");
  const rows = await fetchRows(validateSelect(sql));
  if (!rows.length) throw badRequest("No records matched this report request.");

  const planText = await askModel(provider,
    `You format an existing report data set. Return JSON only: {"title":"", "orientation":"portrait"|"landscape", "columns":[{"key":"exact data key","label":"display heading"}]}. Include only columns requested by the user. Set title to an empty string unless the user explicitly requested a title. Do not add summaries, commentary, assumptions, or columns that are not in the data.`,
    `User request: ${request}\nAvailable columns: ${safeJson(Object.keys(rows[0]))}\nRepresentative data (for formatting only): ${safeJson(rows.slice(0, 20))}`);
  const plan = normalizePlan(parseJson(planText, "The report formatter returned an invalid layout response."), rows);
  const buffer = await Packer.toBuffer(buildDocument(plan, rows));
  return { buffer, rowCount: rows.length, model: provider === "groq" ? config.groqModel : config.geminiModel };
}
