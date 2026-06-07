import type { EmailCache, Environment } from './types';
import {
    renderEmailListMode,
    renderEmailPreviewMode,
    renderEmailSummaryMode,
} from './mail/render';

// 模拟邮件数据
const mockEmailCache: EmailCache = {
    id: 'test-uuid-12345',
    messageId: '<test@example.com>',
    from: 'noreply@weex.com',
    to: 'user@example.com',
    subject: 'USDT 存款确认',
    text: `[https://s3.weexstg.com/otc/images/marketing-email/7270287be03cb3a2f59f8db3f56d08db.png]
[https://s3.weexstg.com/otc/images/marketing-email/75c98ec4177d4954b1bfb4256c169c2f.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjWD5DPdxMFuIATC1X7jcluc-3D5Axj_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6wspma54sdctwdVjuvV4kYnQww5T3uBwRKmQNjpjb t2x46-2FxnX75z-2BLfaOIOMstSItrQzivAAME-2BhGn0JtKziZlazigdjT4eStKjOicLQPDStDPapJ07fJcF3DJ5 JNIi92XwNPHF2CWUaNN-2BcngyyTndZr58fZkcGatAt4opKslJooz-2FLUqRv5uLkbyHaPlBDVATjrDurWnepo-3D

您收到了USDT 16.9838 USDT 已于UTC+8 2026-06-07 09:56:01 成功存入您的现货账户。
如有疑问或需要帮助，请随时联系客服团队。

WEEX团队下载WEEX app，随时随地开始交易
App Store
[https://s3.weexstg.com/otc/images/marketing-email/5e3927a8a564e4333ac5c7ba28b43aac.png]
App Store
[https://s3.weexstg.com/otc/images/marketing-email/d731567b9f57fb48574e677a3904b335.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjZ9snOTAuRrKUdCTYQaPvimwyK4Axt7Ny4-2FfDK9YE1JDBenaAFi87vnVY0iHiUz5hzumsHiMWGOafJ dji7dI-2B7MMSZR2WHsCxfUSbe2ufYLIw146FINur8ZmPGcHrHjEhb1L6vYAXNdKePpjy8x2KULXVs-2F2rn-2BqvF4rZOiJYmEuNIkp7EGqiUtsu-2BfxboU8jH1VDkxcv4LEhNWK7NtLRhDBoooW2Cv6Lw gz2EA6ngPTdYO5c-2B1IIpAAAVtZtVjsYCRd-2B3IQ4OknPORZdhN5IoY-3D8aNO_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6wspma54sdctwdVjuvV4kYnQww5T3uBwRKmWgLqAdu0vgMSS3xluwcGvo1evex WNZzY2cG9zIqvSeonKH4IJZVTg4AZDIUA2H-2FketgkEiSOgM1Hdks9KvFfGnSenmdn2jtJdMac3CZ RDd-2F-2B-2BWHoDSqYgYQ1VvQzbPbeAHb-2FpZAjENeJIIhgvIcB5gRDY7FKZpNfO0mNmPYl150-3D
Google Play
[https://s3.weexstg.com/otc/images/marketing-email/3ec8308b6ae89884bd734275fd44a544.png]
Google Play
[https://s3.weexstg.com/otc/images/marketing-email/a682daeb3177f6df8ff726ba81dc9bc9.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjXLzM56cugzdoLYpZEueUFw-2B9re2DDrRo78wocLskdOP-2Fi5x-2FKEWT21beQMh2F9OTiADIwIUahA9jJ3zoCkdyFQ-3DVYwh_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6ws pma54sdctwdVjuvV4kYnQww5T3uBwRKm5ZdgAuT0heEIl6cgoR6vrQ4RqT6RnmplS-2BFRrRiRAkrOiz5yChBi2cpQ5me9jthF8Fygh3p edzz0yw9YFYJVp9PcaNWJspEpGTY1KywoyhmFyTLQqCFwKIOywI9hhlZLBwhGuaaeFFUHseMV4u-2F2MCiXpDckEJpagHpUvEy43NY-3D
下载
[https://s3.weexstg.com/otc/images/marketing-email/5a3d6be4209b8ac27440b71a9d163eca.png]
下载
[https://s3.weexstg.com/otc/images/marketing-email/6431f9d96d72536daccd90d7ad565643.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjRMyCsCfyZAWkJ-2Fc3qEuh-2BIiMes1Yxg67S0JgJPod-2Bl-2Fk_Jz_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6wspma54sdctwdVjuvV4kYnQww5 T3uBwRKm923Yb0fzeBE8Lge3UFyteEnuwHCv0YoipHhvRH-2B8n92xR8fA5LJvKUn9BjM5KddubiegYaZryIuQUIkYrjm1A kQagTSxR17Jxc7-2FpX1vfXaaswSEOF5eDDdU7TMcAE9VimrEZOqGa1iUAOT2wm3t83otSMjU3O-2BQNoo-2F5rzAvFE-3D

白色 x 浅色
[https://s3.weexstg.com/otc/images/marketing-email/25941537ba770aa53e2d756c4ba4cba0.png]

想要获取更多信息？欢迎关注我们的社交媒体

YouTube
[https://s3.weexstg.com/otc/images/marketing-email/8c2c2efe28705c6904379356f38318f7.png]
YouTube
[https://s3.weexstg.com/otc/images/marketing-email/1b0bdd27a21bc2b672cc02f7d65a70cf.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjWBiEVEp1BrACkwlOY5HlqaqRW4sfge-2BFHdvNYxbtqRnWZ8k_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6wspma54sdctwdVjuvV4kYnQww5T3uBwR KM-2FsSlQEgpThATO2HuyHmdP2C-2Bajmx9faSgplDpfkiPOKPYP3BiZuCPHYF2eqR6C-2F4O-2FKpiZi9b-2BmMszXca7W rTQnD4NLtnKTi3PFN7RMksxVw3-2F79gArTQ9NW813coTimtYJ6Ie4GQ144W61Y-2F4W6WROoguyat6fwfgYKrvPWOUs-3D
X
[https://s3.weexstg.com/otc/images/marketing-email/29ff61547531feca0d911f69e43dd16c.png]
X
[https://s3.weexstg.com/otc/images/marketing-email/79e55540605a7eedf38e87b06d837067.png]
https://u23896352.ct.sendgrid.net/ls/click?upn=u001.vxxDr-2FfJpr1knYqNNLD-2FjWVc5vmIXb-2BEsqxQKMr2yzU-3DQalh_CBnR2ZgyFQ24qk4aqdPkgflqBQOQk6wspma54sdctwdVjuvV4kYnQww5T3uBwRKmly H56ZcFXTh8ntGAzSpp0ap2wFK1XuXdDmbTEwqQlYxLVR-2FzfiH0NZf0FUTx6VsXucXKb82jSmoS9nCrEuhlHwaGrE7GXSacJ4xFlBVSnEg3r44vcP7p57FqKVwk3yElV9NUTpNOpeEOzzdHhFS-2FpUQlifrmQYb17fTUJEstPRk-3D
Instagram
[https://s3.weexstg.com/otc/images/marketing-email/fe4b90eb666e5423b79890d7fb9b03d3.png]
Instagram
[https://s3.weexstg.com/otc/images/marketing-email/5963afabd47a5a7d8ce35775a5d1f0d8.png]`,
    html: '<html><body><p>WEEX 存款通知邮件</p></body></html>',
    hasAttachment: false,
    date: new Date().toISOString(),
};

// 模拟环境变量
const mockEnv: Environment = {
    DOMAIN: 'localhost:8787',
    TELEGRAM_TOKEN: 'test-token',
    TELEGRAM_ID: '123456789',
    DEBUG: 'true',
    GUARDIAN_MODE: 'false',
    MAX_EMAIL_SIZE_POLICY: 'truncate',
    // 其他可选字段留空
} as any;

async function testRenderModes() {
    console.log('='.repeat(60));
    console.log('测试 List Mode');
    console.log('='.repeat(60));
    const listMode = await renderEmailListMode(mockEmailCache, mockEnv);
    console.log('Text:', listMode.text);
    console.log(
        'Buttons:',
        JSON.stringify(listMode.reply_markup.inline_keyboard, null, 2),
    );
    console.log();

    console.log('='.repeat(60));
    console.log('测试 Preview Mode');
    console.log('='.repeat(60));
    const previewMode = await renderEmailPreviewMode(mockEmailCache, mockEnv);
    console.log('Text length:', previewMode.text.length);
    console.log('Text content:');
    console.log(previewMode.text);
    console.log();
    console.log(
        'Buttons:',
        JSON.stringify(previewMode.reply_markup.inline_keyboard, null, 2),
    );
    console.log();

    console.log('='.repeat(60));
    console.log('测试完成！');
    console.log('='.repeat(60));
}

// 运行测试
testRenderModes().catch(console.error);
