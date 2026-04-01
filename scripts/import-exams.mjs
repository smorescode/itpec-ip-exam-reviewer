import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT_DIR = process.cwd();
const EXAMS_DIR = path.join(ROOT_DIR, "IP Exam");
const OUTPUT_DIR = path.join(ROOT_DIR, "data", "generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "exams.json");
const SEASON_LABELS = {
  A: "Autumn",
  S: "Spring",
};
const CHOICE_KEYS = ["a", "b", "c", "d"];
const DIAGRAM_HINT_PATTERN =
  /\b(figure|fig\.|table below|shown below|shown in the figure|shown in figure|as shown|following table|following figure|diagram)\b/i;

const cmapsUrl = `${pathToFileURL(
  path.join(ROOT_DIR, "node_modules", "pdfjs-dist", "cmaps"),
).href}/`;
const standardFontDataUrl = `${pathToFileURL(
  path.join(ROOT_DIR, "node_modules", "pdfjs-dist", "standard_fonts"),
).href}/`;

function normalizeText(value) {
  return value
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractPdfText(filePath, startPage = 1) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const document = await pdfjs.getDocument({
    data,
    cMapUrl: cmapsUrl,
    cMapPacked: true,
    standardFontDataUrl,
    disableWorker: true,
  }).promise;

  let text = "";

  for (let pageNumber = startPage; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    text += `\n${content.items.map((item) => item.str).join(" ")}`;
  }

  return normalizeText(text);
}

function parseAnswers(answerText) {
  const matches = [...answerText.matchAll(/(\d{1,3})\s+([abcd])\b/gi)];
  const answers = new Map();

  for (const [, questionNumber, answer] of matches) {
    answers.set(Number(questionNumber), answer.toLowerCase());
  }

  if (answers.size < 100) {
    throw new Error(`Expected 100 answers but found ${answers.size}`);
  }

  return answers;
}

function sliceQuestionBlocks(text) {
  const sanitized = text.replace(/-\s*\d+\s*-/g, " ");
  const matches = [...sanitized.matchAll(/Q\s*(\d+)\s*\.?/g)];
  const firstQuestionIndex = matches.findIndex((match) => Number(match[1]) === 1);
  const relevantMatches = firstQuestionIndex === -1 ? matches : matches.slice(firstQuestionIndex);
  const questionBlocks = [];

  for (let index = 0; index < relevantMatches.length; index += 1) {
    const current = relevantMatches[index];
    const next = relevantMatches[index + 1];
    const number = Number(current[1]);

    if (number < 1 || number > 100) {
      continue;
    }

    questionBlocks.push({
      number,
      raw: sanitized.slice(current.index, next ? next.index : sanitized.length).trim(),
    });
  }

  return questionBlocks.filter((block, index, list) => {
    const previous = list[index - 1];
    return !previous || previous.number !== block.number;
  });
}

function parseChoices(questionBody, questionNumber) {
  const markerMatches = [...questionBody.matchAll(/\b([abcd])\)\s*/gi)];

  if (markerMatches.length < 4) {
    return {
      prompt: questionBody.trim(),
      choices: Object.fromEntries(
        CHOICE_KEYS.map((choiceKey) => [
          choiceKey,
          `Option ${choiceKey.toUpperCase()} is diagram-based or could not be extracted cleanly from the PDF.`,
        ]),
      ),
      hasIncompleteText: true,
      parseWarning: `Missing choice markers for Q${questionNumber}`,
    };
  }

  const prompt = questionBody.slice(0, markerMatches[0].index).trim();
  const choices = {};
  let hasIncompleteText = false;

  for (let index = 0; index < CHOICE_KEYS.length; index += 1) {
    const current = markerMatches[index];
    const next = markerMatches[index + 1];
    const value = questionBody.slice(
      current.index + current[0].length,
      next ? next.index : questionBody.length,
    ).trim();

    if (!value) {
      hasIncompleteText = true;
    }

    choices[CHOICE_KEYS[index]] =
      value || `Option ${CHOICE_KEYS[index].toUpperCase()} is diagram-based or could not be extracted cleanly from the PDF.`;
  }

  return {
    prompt,
    choices,
    hasIncompleteText,
    parseWarning: hasIncompleteText ? `Incomplete option text for Q${questionNumber}` : null,
  };
}

function parseQuestions(questionText, answers, examId) {
  const blocks = sliceQuestionBlocks(questionText);

  if (blocks.length < 100) {
    throw new Error(`Expected 100 question blocks but found ${blocks.length}`);
  }

  return blocks.slice(0, 100).map((block) => {
    const body = block.raw.replace(/^Q\s*\d+\s*\.?\s*/i, "").trim();
    const parsed = parseChoices(body, block.number);
    const likelyRequiresDiagram =
      DIAGRAM_HINT_PATTERN.test(parsed.prompt) ||
      Object.values(parsed.choices).some((choice) =>
        choice.includes("diagram-based or could not be extracted cleanly"),
      );

    return {
      id: `${examId}-q${String(block.number).padStart(3, "0")}`,
      number: block.number,
      prompt: parsed.prompt,
      choices: parsed.choices,
      correctAnswer: answers.get(block.number),
      hasIncompleteText: parsed.hasIncompleteText,
      likelyRequiresDiagram,
      parseWarning: parsed.parseWarning,
    };
  });
}

function findExamFiles(examDirectory) {
  const files = fs.readdirSync(examDirectory);

  const questionFile = files.find((fileName) => /question/i.test(fileName));
  const answerFile = files.find((fileName) => /answer/i.test(fileName));

  if (!questionFile || !answerFile) {
    throw new Error(`Could not find question/answer PDFs in ${examDirectory}`);
  }

  return {
    questionFile,
    answerFile,
  };
}

async function importExam(examFolderName) {
  const examDirectory = path.join(EXAMS_DIR, examFolderName);
  const { questionFile, answerFile } = findExamFiles(examDirectory);
  const year = Number(examFolderName.slice(0, 4));
  const seasonCode = examFolderName[4];
  const season = SEASON_LABELS[seasonCode] ?? seasonCode;
  const examId = `${year}-${seasonCode}`;
  const questionText = await extractPdfText(path.join(examDirectory, questionFile), 3);
  const answerText = await extractPdfText(path.join(examDirectory, answerFile), 1);
  const answers = parseAnswers(answerText);
  const questions = parseQuestions(questionText, answers, examId);
  const incompleteCount = questions.filter((question) => question.hasIncompleteText).length;

  return {
    examId,
    title: `${year} ${season}`,
    year,
    season,
    seasonCode,
    questionCount: questions.length,
    incompleteQuestionCount: incompleteCount,
    sourceFiles: {
      questions: path.posix.join("IP Exam", examFolderName, questionFile),
      answers: path.posix.join("IP Exam", examFolderName, answerFile),
    },
    questions,
  };
}

async function main() {
  const examFolders = fs
    .readdirSync(EXAMS_DIR)
    .filter((entry) => /^\d{4}[AS]_IP$/.test(entry))
    .sort((left, right) => right.localeCompare(left));

  const exams = [];

  for (const examFolder of examFolders) {
    const exam = await importExam(examFolder);
    exams.push(exam);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exams, null, 2));

  const summary = exams
    .map(
      (exam) =>
        `${exam.examId}: ${exam.questionCount} questions, ${exam.incompleteQuestionCount} incomplete`,
    )
    .join("\n");

  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
