import type { EmailTemplateKey, EmailTemplateVars } from '@/lib/email/types';

/**
 * Bilingual email template system.
 *
 * Each template has an English and Arabic version. Variables are interpolated
 * using {variableName} syntax. The template renders to { subject, html, text }.
 */

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ==============================================================================
// Template definitions
// ==============================================================================

interface TemplateDefinition {
  subject: { en: string; ar: string };
  body: { en: string; ar: string };
  textBody: { en: string; ar: string };
}

const TEMPLATES: Record<EmailTemplateKey, TemplateDefinition> = {
  welcome: {
    subject: {
      en: 'Welcome to Qudurat, {recipientName}!',
      ar: 'مرحباً بك في قدرات، {recipientName}!',
    },
    body: {
      en: `
        <h1>Welcome to Qudurat!</h1>
        <p>Hi {recipientName},</p>
        <p>Your account has been created for <strong>{organizationName}</strong>. You can now create assessments, invite participants, and generate AI-powered insights.</p>
        <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>مرحباً بك في قدرات!</h1>
          <p>مرحباً {recipientName}،</p>
          <p>تم إنشاء حسابك في <strong>{organizationName}</strong>. يمكنك الآن إنشاء التقييمات ودعوة المشاركين والحصول على رؤى مدعومة بالذكاء الاصطناعي.</p>
          <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">الذهاب إلى لوحة التحكم</a>
        </div>
      `,
    },
    textBody: {
      en: 'Welcome to Qudurat, {recipientName}! Your account is ready at {dashboardUrl}',
      ar: 'مرحباً بك في قدرات، {recipientName}! حسابك جاهز على {dashboardUrl}',
    },
  },

  invite: {
    subject: {
      en: 'You\'re invited to take an assessment — {assessmentTitle}',
      ar: 'أنت مدعو لأداء تقييم — {assessmentTitle}',
    },
    body: {
      en: `
        <h1>Assessment Invitation</h1>
        <p>Hi {recipientName},</p>
        <p><strong>{organizationName}</strong> has invited you to complete the assessment: <strong>{assessmentTitle}</strong></p>
        <p>Group: {groupName}</p>
        <a href="{assessmentUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Start Assessment</a>
        <p style="color:#6b7280;font-size:14px;margin-top:16px;">This link is unique to you. Do not share it.</p>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>دعوة تقييم</h1>
          <p>مرحباً {recipientName}،</p>
          <p>دعتك <strong>{organizationName}</strong> لإكمال التقييم: <strong>{assessmentTitle}</strong></p>
          <p>المجموعة: {groupName}</p>
          <a href="{assessmentUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">ابدأ التقييم</a>
          <p style="color:#6b7280;font-size:14px;margin-top:16px;">هذا الرابط مخصص لك. لا تشاركه.</p>
        </div>
      `,
    },
    textBody: {
      en: '{organizationName} invited you to take: {assessmentTitle}. Start here: {assessmentUrl}',
      ar: 'دعتك {organizationName} لأداء: {assessmentTitle}. ابدأ هنا: {assessmentUrl}',
    },
  },

  reminder: {
    subject: {
      en: 'Reminder: {assessmentTitle} — {daysRemaining} days left',
      ar: 'تذكير: {assessmentTitle} — متبقي {daysRemaining} أيام',
    },
    body: {
      en: `
        <h1>Assessment Reminder</h1>
        <p>Hi {recipientName},</p>
        <p>This is a reminder that you have <strong>{daysRemaining} days</strong> left to complete: <strong>{assessmentTitle}</strong></p>
        <a href="{assessmentUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Continue Assessment</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>تذكير بالتقييم</h1>
          <p>مرحباً {recipientName}،</p>
          <p>هذا تذكير بأن لديك <strong>{daysRemaining} أيام</strong> متبقية لإكمال: <strong>{assessmentTitle}</strong></p>
          <a href="{assessmentUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">متابعة التقييم</a>
        </div>
      `,
    },
    textBody: {
      en: 'Reminder: {daysRemaining} days left for {assessmentTitle}. Continue: {assessmentUrl}',
      ar: 'تذكير: متبقي {daysRemaining} أيام لإكمال {assessmentTitle}. تابع: {assessmentUrl}',
    },
  },

  completion: {
    subject: {
      en: '{recipientName} completed {assessmentTitle}',
      ar: 'أكمل {recipientName} تقييم {assessmentTitle}',
    },
    body: {
      en: `
        <h1>Assessment Completed</h1>
        <p><strong>{recipientName}</strong> has completed the assessment: <strong>{assessmentTitle}</strong></p>
        <p>Score: <strong>{score}</strong></p>
        <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Results</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>تم إكمال التقييم</h1>
          <p>أكمل <strong>{recipientName}</strong> التقييم: <strong>{assessmentTitle}</strong></p>
          <p>النتيجة: <strong>{score}</strong></p>
          <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">عرض النتائج</a>
        </div>
      `,
    },
    textBody: {
      en: '{recipientName} completed {assessmentTitle}. Score: {score}. View: {dashboardUrl}',
      ar: 'أكمل {recipientName} {assessmentTitle}. النتيجة: {score}. عرض: {dashboardUrl}',
    },
  },

  result_ready: {
    subject: {
      en: 'Assessment results are ready — {assessmentTitle}',
      ar: 'نتائج التقييم جاهزة — {assessmentTitle}',
    },
    body: {
      en: `
        <h1>Results Ready</h1>
        <p>Hi {recipientName},</p>
        <p>The AI-generated report for <strong>{assessmentTitle}</strong> is now available.</p>
        <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Report</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>النتائج جاهزة</h1>
          <p>مرحباً {recipientName}،</p>
          <p>التقرير المُنشأ بالذكاء الاصطناعي لـ <strong>{assessmentTitle}</strong> أصبح متاحاً الآن.</p>
          <a href="{dashboardUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">عرض التقرير</a>
        </div>
      `,
    },
    textBody: {
      en: 'Results for {assessmentTitle} are ready. View: {dashboardUrl}',
      ar: 'نتائج {assessmentTitle} جاهزة. عرض: {dashboardUrl}',
    },
  },

  trial_ending: {
    subject: {
      en: 'Your Qudurat trial ends in {daysRemaining} days',
      ar: 'تجربتك في قدرات تنتهي خلال {daysRemaining} أيام',
    },
    body: {
      en: `
        <h1>Trial Ending Soon</h1>
        <p>Hi {recipientName},</p>
        <p>Your free trial of Qudurat ends in <strong>{daysRemaining} days</strong>. Upgrade now to keep access to all features.</p>
        <a href="{upgradeUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Upgrade Plan</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>التجربة المجانية تنتهي قريباً</h1>
          <p>مرحباً {recipientName}،</p>
          <p>تنتهي تجربتك المجانية في قدرات خلال <strong>{daysRemaining} أيام</strong>. قم بالترقية الآن للحفاظ على الوصول لجميع الميزات.</p>
          <a href="{upgradeUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">ترقية الباقة</a>
        </div>
      `,
    },
    textBody: {
      en: 'Your Qudurat trial ends in {daysRemaining} days. Upgrade: {upgradeUrl}',
      ar: 'تنتهي تجربتك في قدرات خلال {daysRemaining} أيام. ترقية: {upgradeUrl}',
    },
  },

  trial_expired: {
    subject: {
      en: 'Your Qudurat trial has expired',
      ar: 'انتهت تجربتك في قدرات',
    },
    body: {
      en: `
        <h1>Trial Expired</h1>
        <p>Hi {recipientName},</p>
        <p>Your free trial of Qudurat has ended. Your data is safe — upgrade to continue using the platform.</p>
        <a href="{upgradeUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Upgrade Now</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>انتهت التجربة المجانية</h1>
          <p>مرحباً {recipientName}،</p>
          <p>انتهت تجربتك المجانية في قدرات. بياناتك آمنة — قم بالترقية لمتابعة استخدام المنصة.</p>
          <a href="{upgradeUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">ترقية الآن</a>
        </div>
      `,
    },
    textBody: {
      en: 'Your Qudurat trial has expired. Upgrade: {upgradeUrl}',
      ar: 'انتهت تجربتك في قدرات. ترقية: {upgradeUrl}',
    },
  },

  payment_failed: {
    subject: {
      en: 'Payment failed — action required',
      ar: 'فشل الدفع — يرجى اتخاذ إجراء',
    },
    body: {
      en: `
        <h1>Payment Failed</h1>
        <p>Hi {recipientName},</p>
        <p>We were unable to process your payment of <strong>{amount}</strong>. Please update your payment method to avoid service interruption.</p>
        <a href="{updatePaymentUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Update Payment Method</a>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>فشل الدفع</h1>
          <p>مرحباً {recipientName}،</p>
          <p>لم نتمكن من معالجة دفعتك بمبلغ <strong>{amount}</strong>. يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.</p>
          <a href="{updatePaymentUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">تحديث طريقة الدفع</a>
        </div>
      `,
    },
    textBody: {
      en: 'Payment of {amount} failed. Update: {updatePaymentUrl}',
      ar: 'فشل الدفع بمبلغ {amount}. تحديث: {updatePaymentUrl}',
    },
  },

  password_reset: {
    subject: {
      en: 'Reset your Qudurat password',
      ar: 'إعادة تعيين كلمة مرور قدرات',
    },
    body: {
      en: `
        <h1>Password Reset</h1>
        <p>Hi {recipientName},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="{resetUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#6b7280;font-size:14px;margin-top:16px;">If you didn't request this, ignore this email.</p>
      `,
      ar: `
        <div dir="rtl" style="text-align:right;">
          <h1>إعادة تعيين كلمة المرور</h1>
          <p>مرحباً {recipientName}،</p>
          <p>اضغط على الزر أدناه لإعادة تعيين كلمة مرورك. ينتهي هذا الرابط خلال ساعة واحدة.</p>
          <a href="{resetUrl}" style="display:inline-block;background:#0D9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">إعادة تعيين كلمة المرور</a>
          <p style="color:#6b7280;font-size:14px;margin-top:16px;">إذا لم تطلب ذلك، تجاهل هذا البريد.</p>
        </div>
      `,
    },
    textBody: {
      en: 'Reset your password: {resetUrl}. Expires in 1 hour.',
      ar: 'إعادة تعيين كلمة المرور: {resetUrl}. ينتهي خلال ساعة.',
    },
  },
};

// ==============================================================================
// Template rendering
// ==============================================================================

function interpolate(template: string, vars: EmailTemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value !== undefined ? String(value) : match;
  });
}

function wrapInLayout(
  bodyHtml: string,
  vars: EmailTemplateVars,
  language: 'en' | 'ar',
): string {
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const fontFamily =
    language === 'ar'
      ? "'Cairo', 'Noto Sans Arabic', sans-serif"
      : "'Inter', 'Segoe UI', sans-serif";

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family:${fontFamily}; }
    .container { max-width:600px; margin:0 auto; padding:40px 20px; }
    .card { background:#fff; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    h1 { color:#0f172a; font-size:24px; margin:0 0 16px; }
    p { color:#334155; font-size:16px; line-height:1.6; margin:0 0 12px; }
    a { display:inline-block; }
    .footer { text-align:center; margin-top:32px; color:#94a3b8; font-size:12px; }
    .footer a { color:#0D9488; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    ${vars.organizationLogo ? `<div style="text-align:center;margin-bottom:24px;"><img src="${vars.organizationLogo}" alt="${vars.organizationName ?? ''}" style="max-height:48px;"></div>` : ''}
    <div class="card">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>${language === 'ar' ? 'مدعوم بواسطة' : 'Powered by'} <a href="https://qudurat.com">Qudurat</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render a lifecycle email template.
 */
export function renderEmailTemplate(
  key: EmailTemplateKey,
  vars: EmailTemplateVars,
  language: 'en' | 'ar' = 'en',
): RenderedEmail {
  const template = TEMPLATES[key];
  if (!template) {
    throw new Error(`Unknown email template: ${key}`);
  }

  const subject = interpolate(template.subject[language], vars);
  const bodyHtml = interpolate(template.body[language], vars);
  const text = interpolate(template.textBody[language], vars);
  const html = wrapInLayout(bodyHtml, vars, language);

  return { subject, html, text };
}
