import { ChurchEvent, EbdLesson, EventCategory, ScheduleSlot, VolunteerStatus } from '../types/church';

export function formatDatePtBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatLongDatePtBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function categoryLabel(category: EventCategory): string {
  switch (category) {
    case 'culto':
      return 'Culto Regular';
    case 'congresso':
      return 'Congresso';
    case 'conferencia':
      return 'Conferência';
    case 'encontro':
      return 'Encontro';
    case 'especial':
      return 'Programação Especial';
  }
}

export function volunteerStatusLabel(status: VolunteerStatus): string {
  switch (status) {
    case 'aguardando':
      return 'Aguardando confirmação';
    case 'confirmado':
      return 'Confirmado';
    case 'recusado':
      return 'Recusado';
    case 'substituicao_solicitada':
      return 'Substituição solicitada';
    case 'substituido':
      return 'Substituído';
    case 'presente':
      return 'Presente';
    case 'ausente':
      return 'Ausente';
  }
}

export function buildPixCopyPaste(key: string, purpose: string, amount?: string): string {
  const cleanKey = key.replace(/\s+/g, '');
  const numericAmount = amount ? Number(amount.replace(',', '.')) : 0;
  const amountTag =
    numericAmount > 0 ? `54${String(numericAmount.toFixed(2).length).padStart(2, '0')}${numericAmount.toFixed(2)}` : '';
  const txid =
    purpose
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 12)
      .toUpperCase() || 'NJSAMPAIO';
  return `00020126480014BR.GOV.BCB.PIX01${String(cleanKey.length).padStart(2, '0')}${cleanKey}520400005303986${amountTag}5802BR5925NOVA JERUSALEM SAMPAIO RJ6014RIO DE JANEIRO62160512${txid}6304B7C3`;
}

export function downloadEventIcs(event: ChurchEvent): void {
  const dateCompact = event.date.replace(/-/g, '');
  const hourMatch = event.time.match(/(\d{1,2})h(\d{2})?/);
  const hh = hourMatch ? String(hourMatch[1]).padStart(2, '0') : '19';
  const mm = hourMatch && hourMatch[2] ? hourMatch[2] : '00';
  const endHour = String(Math.min(23, Number(hh) + 2)).padStart(2, '0');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nova Jerusalem Sampaio//NJ App//PT-BR',
    'BEGIN:VEVENT',
    `UID:${event.id}@novajerusalemsampaio.com.br`,
    `DTSTART:${dateCompact}T${hh}${mm}00`,
    `DTEND:${dateCompact}T${endHour}${mm}00`,
    `SUMMARY:${event.title} — Nova Jerusalém Sampaio`,
    `LOCATION:${event.location} - Rua do Engenho Novo, 229, Sampaio, Rio de Janeiro - RJ`,
    `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NJ_${event.date}_${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildWhatsAppScheduleText(title: string, slots: ScheduleSlot[]): string {
  const header = `*ESCALA OFICIAL — NOVA JERUSALÉM SAMPAIO*\n*${title}*\n`;
  const lines = slots.map(
    (s) =>
      `• ${formatDatePtBR(s.date)} (${s.time}) — ${s.eventTitle}\n  ${s.departmentName ? `[${s.departmentName}] ` : ''}${s.positionName}: *${s.volunteerName}* (${volunteerStatusLabel(s.volunteerStatus)})`
  );
  return `${header}\n${lines.join('\n\n')}\n\nConfirme sua participação pelo NJ App.`;
}

function sanitizePdfText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[·•]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = sanitizePdfText(text).split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!word) continue;
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function generateSimplePdf(
  lines: { text: string; size: number; bold?: boolean; gap?: number }[],
  fileName: string
): void {
  const pages: string[][] = [];
  let currentCmds: string[] = [];
  let y = 790;

  for (const line of lines) {
    const step = line.gap || 14;
    if (y - step < 56) {
      pages.push(currentCmds);
      currentCmds = [];
      y = 790;
    }
    if (line.text) {
      const fontKey = line.bold ? '/F2' : '/F1';
      currentCmds.push(`BT ${fontKey} ${line.size} Tf 50 ${y} Td (${sanitizePdfText(line.text)}) Tj ET`);
    }
    y -= step;
  }
  if (currentCmds.length > 0) pages.push(currentCmds);

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  const pageObjStart = 5;
  const pageKids: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    pageKids.push(`${pageObjStart + i * 2} 0 R`);
  }
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${pages.length} >>\nendobj`);
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  pages.forEach((cmds, i) => {
    const pageId = pageObjStart + i * 2;
    const contentId = pageId + 1;
    const stream = cmds.join('\n');
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`
    );
    objects.push(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadEbdLessonPdf(lesson: EbdLesson): void {
  const lines: { text: string; size: number; bold?: boolean; gap?: number }[] = [
    { text: 'NOVA JERUSALEM SAMPAIO - EBD DIGITAL', size: 10, bold: true, gap: 16 },
    { text: `LICAO ${String(lesson.number).padStart(2, '0')} - ${lesson.title}`, size: 15, bold: true, gap: 22 },
    { text: `${lesson.quarter} | Tema: ${lesson.theme}`, size: 10, gap: 14 },
    { text: `Data: ${formatDatePtBR(lesson.date)} | Texto Biblico: ${lesson.bibleText} | Autor: ${lesson.author}`, size: 10, gap: 18 },
    { text: 'TEXTO AUREO', size: 11, bold: true, gap: 15 },
    ...wrapText(lesson.goldenVerse, 82).map((t) => ({ text: t, size: 10, gap: 14 })),
    { text: '', size: 10, gap: 8 },
    { text: 'INTRODUCAO', size: 11, bold: true, gap: 15 },
    ...wrapText(lesson.summary, 84).map((t) => ({ text: t, size: 10, gap: 14 })),
    { text: '', size: 10, gap: 8 },
  ];

  for (const sec of lesson.sections) {
    lines.push({ text: sec.heading, size: 11, bold: true, gap: 16 });
    for (const w of wrapText(sec.content, 84)) {
      lines.push({ text: w, size: 10, gap: 14 });
    }
    lines.push({ text: '', size: 10, gap: 8 });
  }

  lines.push({ text: 'PERGUNTAS PARA REFLEXAO', size: 11, bold: true, gap: 16 });
  lesson.reflectionQuestions.forEach((q, idx) => {
    for (const w of wrapText(`${idx + 1}. ${q}`, 82)) {
      lines.push({ text: w, size: 10, gap: 14 });
    }
  });
  lines.push({ text: '', size: 10, gap: 8 });
  lines.push({ text: 'APLICACAO PRATICA DA SEMANA', size: 11, bold: true, gap: 16 });
  for (const w of wrapText(lesson.practicalApplication, 84)) {
    lines.push({ text: w, size: 10, gap: 14 });
  }

  generateSimplePdf(lines, lesson.pdfFileName || `NJ_EBD_Licao_${lesson.number}.pdf`);
}

export function downloadSchedulePdf(title: string, slots: ScheduleSlot[]): void {
  const lines: { text: string; size: number; bold?: boolean; gap?: number }[] = [
    { text: 'IGREJA BATISTA EM RENOVACAO ESPIRITUAL NOVA JERUSALEM', size: 10, bold: true, gap: 15 },
    { text: `ESCALA OFICIAL - ${title}`, size: 14, bold: true, gap: 22 },
    { text: 'Rua do Engenho Novo, 229 - Sampaio - Rio de Janeiro / RJ', size: 9, gap: 18 },
  ];

  for (const slot of slots) {
    const dept = slot.departmentName ? `[${slot.departmentName}] ` : '';
    lines.push({
      text: `${formatDatePtBR(slot.date)} (${slot.time}) - ${slot.eventTitle}`,
      size: 10,
      bold: true,
      gap: 14,
    });
    lines.push({
      text: `   ${dept}${slot.positionName}: ${slot.volunteerName} | Status: ${volunteerStatusLabel(slot.volunteerStatus)}`,
      size: 10,
      gap: 16,
    });
  }

  const safeSlug = sanitizePdfText(title).replace(/[^A-Za-z0-9]+/g, '_');
  generateSimplePdf(lines, `Escala_NJ_${safeSlug}.pdf`);
}
