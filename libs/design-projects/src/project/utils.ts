import {
  AlignmentType,
  IParagraphOptions,
  Paragraph,
  ParagraphChild,
  TextRun,
  convertMillimetersToTwip,
} from 'docx';

export const FONT = 'Arial';

// To define centimeters in a image's size
export function cm(centimeters: number) {
  return convertMillimetersToTwip((100 * centimeters) / 150);
}

// To define centimeters in a floating image's position
export function cmToEmu(cm: number) {
  return Math.round(cm * 360000);
}

// To define centimeters in a text
export function cmText(cm: number) {
  return Math.round(cm * 567);
}

export function bold(text: string): TextRun {
  return new TextRun({
    text,
    bold: true,
    font: FONT,
  });
}

/**
 * Crea un texto simple
 */
export function t(text: string): TextRun {
  return new TextRun({
    text,
    font: FONT,
  });
}

/**
 * Crea un parrafo justificado, con margenes y espacio entre linea
 */
export function p(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 200,
      after: 200,
      line: 400,
    },
    children,
    ...args,
  });
}

export function p2(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 100,
      after: 100,
      line: 400,
    },
    children,
    ...args,
  });
}

export function p3(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 50,
      after: 50,
      line: 400,
    },
    children,
    ...args,
  });
}
