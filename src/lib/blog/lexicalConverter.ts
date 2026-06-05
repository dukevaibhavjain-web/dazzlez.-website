/**
 * Convert Claude-generated markdown/text sections to Lexical JSON format
 * Lexical is the rich text editor used by Payload CMS v3
 */

export type LexicalEditorState = {
  root: {
    type: "root";
    children: LexicalNode[];
    direction: "ltr" | "rtl" | null;
    format: string;
    indent: number;
    version: number;
  };
};

export type LexicalNode = LexicalHeading | LexicalParagraph | LexicalLineBreak;

export type LexicalHeading = {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: LexicalTextNode[];
  direction: "ltr" | "rtl" | null;
  format: string;
  indent: number;
  version: number;
};

export type LexicalParagraph = {
  type: "paragraph";
  children: LexicalTextNode[];
  direction: "ltr" | "rtl" | null;
  format: string;
  indent: number;
  version: number;
};

export type LexicalLineBreak = {
  type: "linebreak";
  version: number;
};

export type LexicalTextNode = {
  type: "text";
  text: string;
  format: number;
  style: string;
  mode: "normal" | "token" | "segmented";
  detail: number;
  version: number;
};

/**
 * Convert sections to Lexical JSON format
 * Input: array of { heading, content } where content is plain text
 * Output: Lexical EditorState with h2 headings + paragraph content
 */
export function sectionsToLexical(
  sections: Array<{ heading: string; content: string }>,
  faqItems?: Array<{ question: string; answer: string }>
): LexicalEditorState {
  const children: LexicalNode[] = [];

  // Process sections
  for (const section of sections) {
    // Add h2 heading
    children.push({
      type: "heading",
      tag: "h2",
      children: [createTextNode(section.heading)],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });

    // Split content by line breaks and create paragraphs
    const lines = section.content.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      children.push({
        type: "paragraph",
        children: [createTextNode(line)],
        direction: null,
        format: "",
        indent: 0,
        version: 1,
      });
    }

    // Add a line break between sections for readability
    children.push({
      type: "linebreak",
      version: 1,
    });
  }

  // Add FAQ section if provided
  if (faqItems && faqItems.length > 0) {
    children.push({
      type: "heading",
      tag: "h2",
      children: [createTextNode("Frequently Asked Questions")],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });

    for (const faq of faqItems) {
      // FAQ question as h3
      children.push({
        type: "heading",
        tag: "h3",
        children: [createTextNode(faq.question)],
        direction: null,
        format: "",
        indent: 0,
        version: 1,
      });

      // FAQ answer as paragraphs
      const answerLines = faq.answer.split("\n").filter((line) => line.trim());
      for (const line of answerLines) {
        children.push({
          type: "paragraph",
          children: [createTextNode(line)],
          direction: null,
          format: "",
          indent: 0,
          version: 1,
        });
      }
    }
  }

  return {
    root: {
      type: "root",
      children,
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

/**
 * Helper to create a text node
 */
function createTextNode(text: string): LexicalTextNode {
  return {
    type: "text",
    text,
    format: 0,
    style: "",
    mode: "normal",
    detail: 0,
    version: 1,
  };
}

/**
 * Convert Intro + Sections + Conclusion to Lexical
 * Intro and conclusion are treated as regular paragraphs
 */
export function blogToLexical(
  intro: string,
  sections: Array<{ heading: string; content: string }>,
  conclusion: string,
  faqItems?: Array<{ question: string; answer: string }>
): LexicalEditorState {
  const children: LexicalNode[] = [];

  // Add intro paragraphs
  const introLines = intro.split("\n").filter((line) => line.trim());
  for (const line of introLines) {
    children.push({
      type: "paragraph",
      children: [createTextNode(line)],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });
  }

  // Add sections
  for (const section of sections) {
    children.push({
      type: "heading",
      tag: "h2",
      children: [createTextNode(section.heading)],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });

    const lines = section.content.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      children.push({
        type: "paragraph",
        children: [createTextNode(line)],
        direction: null,
        format: "",
        indent: 0,
        version: 1,
      });
    }
  }

  // Add conclusion
  const conclusionLines = conclusion.split("\n").filter((line) => line.trim());
  for (const line of conclusionLines) {
    children.push({
      type: "paragraph",
      children: [createTextNode(line)],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });
  }

  // Add FAQ
  if (faqItems && faqItems.length > 0) {
    children.push({
      type: "heading",
      tag: "h2",
      children: [createTextNode("Frequently Asked Questions")],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    });

    for (const faq of faqItems) {
      children.push({
        type: "heading",
        tag: "h3",
        children: [createTextNode(faq.question)],
        direction: null,
        format: "",
        indent: 0,
        version: 1,
      });

      const answerLines = faq.answer.split("\n").filter((line) => line.trim());
      for (const line of answerLines) {
        children.push({
          type: "paragraph",
          children: [createTextNode(line)],
          direction: null,
          format: "",
          indent: 0,
          version: 1,
        });
      }
    }
  }

  return {
    root: {
      type: "root",
      children,
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
}
