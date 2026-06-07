import type * as Telegram from 'telegram-bot-api-types';
import type { EmailCache, Environment } from '../types';
import { checkAddressStatus } from './check';
import { summarizedByOpenAI, summarizedByWorkerAI } from './summarization';

export interface EmailDetailParams {
    text: string;
    reply_markup: Telegram.InlineKeyboardMarkup;
    link_preview_options: Telegram.LinkPreviewOptions;
}

export type EmailRender = (mail: EmailCache, env: Environment) => Promise<EmailDetailParams>;

export async function renderEmailListMode(mail: EmailCache, env: Environment): Promise<EmailDetailParams> {
    const {
        DEBUG,
        OPENAI_API_KEY,
        WORKERS_AI_MODEL,
        AI,
        DOMAIN,
    } = env;

    // 获取邮件内容预览（清理后的前200字符）
    const cleanedText = cleanEmailText(mail.text);
    const preview = cleanedText.substring(0, 200);
    const previewText = preview.length < cleanedText.length ? `${preview}...` : preview;

    const text = `${mail.subject}\n\n-----------\nFrom\t:\t${mail.from}\nTo\t\t:\t${mail.to}\n\n${previewText}`;

    const keyboard: Telegram.InlineKeyboardButton[] = [
        {
            text: 'Preview',
            callback_data: `p:${mail.id}`,
        },
    ];
    if ((AI && WORKERS_AI_MODEL) || OPENAI_API_KEY) {
        keyboard.push({
            text: 'Summary',
            callback_data: `s:${mail.id}`,
        });
    }
    if (mail.text) {
        keyboard.push({
            text: 'Text',
            url: `https://${DOMAIN}/email/${mail.id}?mode=text`,
        });
    }
    if (mail.html) {
        keyboard.push({
            text: 'HTML',
            url: `https://${DOMAIN}/email/${mail.id}?mode=html`,
        });
    }
    if (DEBUG === 'true') {
        keyboard.push({
            text: 'Debug',
            callback_data: `d:${mail.id}`,
        });
    }
    return {
        text,
        reply_markup: {
            inline_keyboard: [keyboard],
        },
        link_preview_options: {
            is_disabled: true,
        },
    };
}

function renderEmailDetail(text: string | undefined | null, id: string): EmailDetailParams {
    return {
        text: text || 'No content',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Back',
                        callback_data: `l:${id}`,
                    },
                    {
                        text: 'Delete',
                        callback_data: 'delete',
                    },
                ],
            ],
        },
        link_preview_options: {
            is_disabled: true,
        },
    };
}

function cleanEmailText(text: string | undefined | null): string {
    if (!text) return 'No content';

    let cleaned = text;

    // 移除图片链接标记 [https://...]
    cleaned = cleaned.replace(/\[https?:\/\/[^\]]+\]/g, '');

    // 移除追踪链接（通常很长，包含大量编码字符）
    // 匹配包含 upn=, click?, -2F, -3D 等特征的长 URL
    cleaned = cleaned.replace(/https?:\/\/[^\s]*(?:upn=|click\?)[^\s]*/g, '');

    // 移除 URL 编码残留（包含 -2F, -3D, -2B 等特征的字符串，通常是 URL 片段）
    // 匹配至少包含3个编码模式的行
    cleaned = cleaned.replace(/^[^\n]*(?:-2[A-F]|_CB|upn)[^\n]*$/gm, '');

    // 移除常见的营销/社交媒体内容
    const marketingPatterns = [
        /想要获取更多信息.*/s, // 从"想要获取更多信息"开始的所有内容
        /关注我们的社交媒体.*/s,
        /下载.*app.*/gi,
        /白色\s*x\s*浅色/g,
    ];
    marketingPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // 移除重复的应用商店标签
    cleaned = cleaned.replace(/^(App Store|Google Play|YouTube|Instagram|X|下载)\s*$/gm, '');

    // 移除多余的空行（3个或以上连续换行符）
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 移除行首行尾空白
    cleaned = cleaned.trim();

    return cleaned;
}

// eslint-disable-next-line unused-imports/no-unused-vars
export async function renderEmailPreviewMode(mail: EmailCache, env: Environment): Promise<EmailDetailParams> {
    // 构建邮件头信息
    const header = [
        `📧 主题: ${mail.subject}`,
        `📤 发件人: ${mail.from}`,
        `📥 收件人: ${mail.to}`,
        mail.date ? `🕐 时间: ${new Date(mail.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}` : null,
        '',
        '─'.repeat(40),
        '',
    ].filter(Boolean).join('\n');

    const cleanedText = cleanEmailText(mail.text);
    const fullText = header + cleanedText;

    return renderEmailDetail(fullText.substring(0, 4096), mail.id);
}

export async function renderEmailSummaryMode(mail: EmailCache, env: Environment): Promise<EmailDetailParams> {
    const {
        AI,
        OPENAI_API_KEY,
        WORKERS_AI_MODEL,
        OPENAI_COMPLETIONS_API = 'https://api.openai.com/v1/chat/completions',
        OPENAI_CHAT_MODEL = 'gpt-4o-mini',
        SUMMARY_TARGET_LANG = 'english',
    } = env;

    const req = renderEmailDetail('', mail.id);
    const prompt = `Summarize the following text in approximately 50 words with ${SUMMARY_TARGET_LANG}\n\n${mail.text}`;

    try {
        if (AI && WORKERS_AI_MODEL) {
            req.text = await summarizedByWorkerAI(AI, WORKERS_AI_MODEL, prompt);
        } else if (OPENAI_API_KEY) {
            req.text = await summarizedByOpenAI(OPENAI_API_KEY, OPENAI_COMPLETIONS_API, OPENAI_CHAT_MODEL, prompt);
        } else {
            req.text = 'Sorry, no summarization provider is configured.';
        }
    } catch (e) {
        req.text = `Failed to summarize the email: ${(e as Error).message}`;
    }
    return req;
}

export async function renderEmailDebugMode(mail: EmailCache, env: Environment): Promise<EmailDetailParams> {
    const addresses = [
        mail.from,
        mail.to,
    ];
    const res = await checkAddressStatus(addresses, env);
    const obj = {
        ...mail,
        block: res,
    };
    delete obj.html;
    delete obj.text;
    const text = JSON.stringify(obj, null, 2);
    return renderEmailDetail(text, mail.id);
}
