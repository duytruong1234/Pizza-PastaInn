import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { Response } from 'express';

const router = Router();

const slugToChapterId: Record<string, string> = {
  terms: 'chinh_sach_su_dung',
  privacy: 'bao_mat_thong_tin',
  delivery: 'chinh_sach_giao_hang',
};

const chapterIdToSlug: Record<string, string> = {
  chinh_sach_su_dung: 'terms',
  bao_mat_thong_tin: 'privacy',
  chinh_sach_giao_hang: 'delivery',
};

// Helper to parse HTML string into structured sub items
function parseHtmlToSubItems(html: string): Array<{ item_number: string | null, content: string, display_order: number }> {
  const subItems: Array<{ item_number: string | null, content: string, display_order: number }> = [];
  const tagRegex = /<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let order = 10;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2].trim();

    if (tag === 'p') {
      subItems.push({
        item_number: null,
        content: innerHtml,
        display_order: order
      });
    } else if (tag === 'li') {
      // Check if it starts with a strong tag containing list number/bullet: e.g. <strong>a)</strong> or <strong>-</strong>
      const strongRegex = /^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/i;
      const strongMatch = innerHtml.match(strongRegex);

      if (strongMatch) {
        const strongText = strongMatch[1].trim();
        const remainingText = strongMatch[2].trim();

        // check if strongText is a list indicator like a), b), -, *, or even bullet characters
        const listIndicatorRegex = /^([a-zA-Z]\)|\-|\*|•)\s*([\s\S]*)$/;
        const indicatorMatch = strongText.match(listIndicatorRegex);

        if (indicatorMatch) {
          const item_number = indicatorMatch[1].trim();
          const restOfStrong = indicatorMatch[2].trim();
          let content = remainingText;
          if (restOfStrong) {
            content = `<strong>${restOfStrong}</strong> ${remainingText}`;
          }
          subItems.push({
            item_number,
            content,
            display_order: order
          });
        } else {
          // If strongText is not a list indicator, treat it as a bullet item with strong prefix
          subItems.push({
            item_number: '-',
            content: innerHtml,
            display_order: order
          });
        }
      } else {
        // No strong tag, check if innerHtml starts with a list indicator
        const listIndicatorRegex = /^([a-zA-Z]\)|\-|\*|•)\s*([\s\S]*)$/;
        const textMatch = innerHtml.match(listIndicatorRegex);

        if (textMatch) {
          subItems.push({
            item_number: textMatch[1].trim(),
            content: textMatch[2].trim(),
            display_order: order
          });
        } else {
          subItems.push({
            item_number: '-',
            content: innerHtml,
            display_order: order
          });
        }
      }
    }
    order += 10;
  }

  if (subItems.length === 0 && html.trim()) {
    subItems.push({
      item_number: null,
      content: html.trim(),
      display_order: 10
    });
  }

  return subItems;
}

// Helper to rebuild HTML string from structured sub items
function buildSectionBody(subItems: Array<{ item_number: string | null, content: string }>): string {
  let body = '';
  let inList = false;

  for (const item of subItems) {
    if (item.item_number === null) {
      if (inList) {
        body += '</ul>\n';
        inList = false;
      }
      body += `<p>${item.content}</p>\n`;
    } else {
      if (!inList) {
        body += '<ul>\n';
        inList = true;
      }
      if (item.item_number === '-' || item.item_number === '*' || item.item_number === '•') {
        body += `<li>${item.item_number} ${item.content}</li>\n`;
      } else {
        body += `<li><strong>${item.item_number}</strong> ${item.content}</li>\n`;
      }
    }
  }
  if (inList) {
    body += '</ul>\n';
  }
  return body.trim();
}

// Helper to rebuild plain text from structured sub items
function buildSectionBodyPlain(subItems: Array<{ item_number: string | null, content: string }>): string {
  return subItems.map(item => {
    // Strip HTML tags to return clean plain text
    const cleanContent = item.content.replace(/<[^>]*>/g, '').trim();
    if (item.item_number) {
      return `${item.item_number} ${cleanContent}`;
    }
    return cleanContent;
  }).join('\n');
}

// Helper to parse plain text into structured sub items
function parsePlainTextToSubItems(text: string): Array<{ item_number: string | null, content: string, display_order: number }> {
  const lines = text.split(/\r?\n/);
  const subItems: Array<{ item_number: string | null, content: string, display_order: number }> = [];
  let order = 10;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Matches bullet indicator (-, *, •) or alphanumeric list indicator (a), 1), etc.) followed by content
    const listIndicatorRegex = /^([a-zA-Z0-9]+[\)\.]|\-|\*|•)\s*(.+)$/;
    const match = trimmed.match(listIndicatorRegex);

    if (match) {
      subItems.push({
        item_number: match[1],
        content: match[2].trim(),
        display_order: order
      });
    } else {
      subItems.push({
        item_number: null,
        content: trimmed,
        display_order: order
      });
    }
    order += 10;
  }

  if (subItems.length === 0 && text.trim()) {
    subItems.push({
      item_number: null,
      content: text.trim(),
      display_order: 10
    });
  }

  return subItems;
}

function getRomanValue(roman: string): number {
  const map: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
    xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20
  };
  return map[roman.toLowerCase()] || 0;
}

function getChapterSortWeight(title: string): number {
  const romanMatch = title.trim().match(/^([IVXLCDM]+)[\.\s]/i);
  if (romanMatch) {
    const val = getRomanValue(romanMatch[1]);
    if (val > 0) return val;
  }
  const numMatch = title.trim().match(/^(\d+)[\.\s]/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }
  return 999999;
}

// GET /api/policies - Lấy danh sách tất cả các chính sách
router.get('/', async (_req, res: Response) => {
  try {
    const chapters = await prisma.policyChapter.findMany();

    const policies = chapters.map(chapter => {
      const slug = chapterIdToSlug[chapter.id] || chapter.id;
      return {
        slug,
        title: chapter.chapter_name,
        updated_at: chapter.last_updated
      };
    });

    // Sắp xếp theo thứ tự La Mã hoặc số thường ở tiền tố tiêu đề
    policies.sort((a, b) => {
      const wA = getChapterSortWeight(a.title);
      const wB = getChapterSortWeight(b.title);
      if (wA !== wB) return wA - wB;
      return a.slug.localeCompare(b.slug);
    });

    sendSuccess(res, { data: policies });
  } catch (err) {
    logger.error('Get policies error:', err);
    sendError(res, 'Lỗi khi lấy danh sách chính sách', 500);
  }
});

// POST /api/policies - Tạo chính sách mới (chỉ admin)
router.post('/', verifyToken, checkRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, chapter_name } = req.body;
    if (!id || !chapter_name) {
      sendError(res, 'Thiếu mã hoặc tên chính sách', 400);
      return;
    }

    const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!sanitizedId) {
      sendError(res, 'Mã chính sách không hợp lệ', 400);
      return;
    }

    const existing = await prisma.policyChapter.findUnique({
      where: { id: sanitizedId }
    });

    if (existing) {
      sendError(res, 'Mã chính sách đã tồn tại', 400);
      return;
    }

    const newChapter = await prisma.policyChapter.create({
      data: {
        id: sanitizedId,
        chapter_name: chapter_name.trim(),
        last_updated: new Date(),
        created_at: new Date()
      }
    });

    sendSuccess(res, {
      data: {
        slug: newChapter.id,
        title: newChapter.chapter_name,
        updated_at: newChapter.last_updated
      },
      message: 'Tạo chính sách mới thành công'
    });
  } catch (err) {
    logger.error('Create policy error:', err);
    sendError(res, 'Lỗi khi tạo chính sách mới', 500);
  }
});

// GET /api/policies/:slug - Lấy chi tiết một chính sách
router.get('/:slug', async (req, res: Response) => {
  try {
    const { slug } = req.params;
    const { format } = req.query;
    const chapterId = slugToChapterId[slug] || slug;

    const chapter = await prisma.policyChapter.findUnique({
      where: { id: chapterId },
      include: {
        sections: {
          orderBy: { display_order: 'desc' },
          include: {
            sub_items: {
              orderBy: { display_order: 'desc' }
            }
          }
        }
      }
    });

    if (!chapter) {
      sendError(res, 'Không tìm thấy chính sách', 404);
      return;
    }

    let content;
    if (format === 'structured') {
      content = chapter.sections.map(section => ({
        section_number: section.section_number,
        title_section: section.title_section,
        display_order: section.display_order || 0,
        sub_items: section.sub_items.map(sub => ({
          item_number: sub.item_number,
          content: sub.content,
          display_order: sub.display_order || 0
        }))
      }));
    } else {
      content = chapter.sections.map(section => {
        let displayTitle = section.title_section;
        if (section.section_number && !displayTitle.startsWith(section.section_number)) {
          displayTitle = `${section.section_number} ${displayTitle}`;
        }
        return {
          id: section.section_number,
          title: displayTitle,
          icon: 'FileText',
          body: format === 'plain' ? buildSectionBodyPlain(section.sub_items) : buildSectionBody(section.sub_items)
        };
      });
    }

    sendSuccess(res, {
      data: {
        slug,
        title: chapter.chapter_name,
        content,
        updated_at: chapter.last_updated
      }
    });
  } catch (err) {
    logger.error('Get policy detail error:', err);
    sendError(res, 'Lỗi khi lấy chi tiết chính sách', 500);
  }
});

// PUT /api/policies/:slug - Cập nhật một chính sách (chỉ admin)
router.put('/:slug', verifyToken, checkRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { format } = req.query;
    const { title, content } = req.body;

    if (!title || !content || !Array.isArray(content)) {
      sendError(res, 'Thiếu tiêu đề hoặc nội dung chính sách', 400);
      return;
    }

    const chapterId = slugToChapterId[slug as string] || (slug as string);

    if (format === 'structured') {
      await prisma.$transaction(async (tx) => {
        await tx.policyChapter.update({
          where: { id: chapterId },
          data: {
            chapter_name: title.trim(),
            last_updated: new Date()
          }
        });

        await tx.policySection.deleteMany({
          where: { chapter_id: chapterId }
        });

        for (const sec of content) {
          await tx.policySection.create({
            data: {
              chapter_id: chapterId,
              section_number: sec.section_number || '',
              title_section: sec.title_section || '',
              display_order: sec.display_order || 0,
              sub_items: {
                create: (sec.sub_items || []).map((sub: any) => ({
                  item_number: sub.item_number || '',
                  content: sub.content || '',
                  display_order: sub.display_order || 0
                }))
              }
            }
          });
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.policyChapter.update({
          where: { id: chapterId },
          data: {
            chapter_name: title,
            last_updated: new Date()
          }
        });

        await tx.policySection.deleteMany({
          where: { chapter_id: chapterId }
        });

        let sectionDisplayOrder = 10;
        for (const inputSec of content) {
          let sectionNumber = inputSec.id || '';
          let titleSection = inputSec.title || '';

          if (sectionNumber && titleSection.startsWith(sectionNumber)) {
            titleSection = titleSection.slice(sectionNumber.length).trim();
          }

          const isHtml = /<[a-z][\s\S]*>/i.test(inputSec.body || '');
          const subItemsData = isHtml
            ? parseHtmlToSubItems(inputSec.body || '')
            : parsePlainTextToSubItems(inputSec.body || '');

          await tx.policySection.create({
            data: {
              chapter_id: chapterId,
              section_number: sectionNumber,
              title_section: titleSection,
              display_order: sectionDisplayOrder,
              sub_items: {
                create: subItemsData.map(item => ({
                  item_number: item.item_number,
                  content: item.content,
                  display_order: item.display_order
                }))
              }
            }
          });

          sectionDisplayOrder += 10;
        }
      });
    }

    const updatedChapter = await prisma.policyChapter.findUnique({
      where: { id: chapterId },
      include: {
        sections: {
          orderBy: { display_order: 'desc' },
          include: {
            sub_items: {
              orderBy: { display_order: 'desc' }
            }
          }
        }
      }
    });

    let responseContent;
    if (format === 'structured') {
      responseContent = updatedChapter!.sections.map(section => ({
        section_number: section.section_number,
        title_section: section.title_section,
        display_order: section.display_order || 0,
        sub_items: section.sub_items.map(sub => ({
          item_number: sub.item_number,
          content: sub.content,
          display_order: sub.display_order || 0
        }))
      }));
    } else {
      responseContent = updatedChapter!.sections.map(section => {
        let displayTitle = section.title_section;
        if (section.section_number && !displayTitle.startsWith(section.section_number)) {
          displayTitle = `${section.section_number} ${displayTitle}`;
        }
        return {
          id: section.section_number,
          title: displayTitle,
          icon: 'FileText',
          body: format === 'plain' ? buildSectionBodyPlain(section.sub_items) : buildSectionBody(section.sub_items)
        };
      });
    }

    sendSuccess(res, {
      data: {
        slug,
        title: updatedChapter!.chapter_name,
        content: responseContent,
        updated_at: updatedChapter!.last_updated
      },
      message: 'Cập nhật chính sách thành công'
    });
  } catch (err) {
    logger.error('Update policy error:', err);
    sendError(res, 'Lỗi khi cập nhật chính sách', 500);
  }
});

// DELETE /api/policies/:slug - Xóa một chính sách (chỉ admin)
router.delete('/:slug', verifyToken, checkRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const chapterId = slugToChapterId[slug as string] || (slug as string);

    const existing = await prisma.policyChapter.findUnique({
      where: { id: chapterId }
    });

    if (!existing) {
      sendError(res, 'Không tìm thấy chính sách để xóa', 404);
      return;
    }

    await prisma.policyChapter.delete({
      where: { id: chapterId }
    });

    sendSuccess(res, { message: 'Xóa chính sách thành công' });
  } catch (err) {
    logger.error('Delete policy error:', err);
    sendError(res, 'Lỗi khi xóa chính sách', 500);
  }
});

export default router;
