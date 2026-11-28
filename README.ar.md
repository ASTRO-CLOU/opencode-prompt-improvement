# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | العربية | [हिन्दी](README.hi.md)

إضافة OpenCode V2 تُحسّن الموجه **في لحظة إرساله**. تكتب رسالة قصيرة، فيستلم النموذج نسخة أنظف وأكثر تنظيمًا. يُحفظ النص المُحسَّن في سجل الجلسة، فترى بالضبط ما أُرسل.

لا تختلق الإضافة حقائق أو متطلبات أو أمثلة أو عناوين. افتراضيًا **لا تستهلك أي رموز نموذج**. يمكنك اختيار نموذج رخيص منفصل للتنقيح النهائي؛ ولا يُستخدم أبدًا نموذج الجلسة الرئيسي في التحسين.

## عرض

```text
تكتب:
  "أصلح خطأ تسجيل الدخول أضف اختبارات أيضًا وتحقق من API"

النموذج يستلم:
  - أصلح خطأ تسجيل الدخول
  - أضف اختبارات
  - تحقق من API
```

## المزايا

- خطاف موجه فوري: التحسين قبل وصوله إلى النموذج.
- آمن افتراضيًا: تنظيف حتمي بلا استدعاء نموذج.
- تنقيح LLM اختياري مع نموذج تختاره صراحةً فقط.
- بلا حقائق أو متطلبات أو خطوات أو أمثلة أو عناوين أو ترجمات جديدة.
- يحفظ الشيفرة وعناوين URL والمسارات والأرقام والمعرّفات و`@الإشارات`.
- يتخطى الأوامر والموجهات القصيرة جدًا أو الغنية بالشيفرة أو المنظمة أصلًا.
- سياق الجلسة الحالية أو الأخيرة للإشارة إلى المصطلحات فقط، لا كمصدر حقائق.
- شارة حالة في TUI ولوحة فيها فرق وسجل وإحصاءات.
- أوامر slash وإعدادات دائمة وتخزين مؤقت محلي.
- سريع: الوضع الآمن فوري، ووضع LLM بمهلة 3.5 ثانية وتخزين مؤقت.

## التثبيت

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

تثبيت إصدار محدد:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

أو في `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

إن لم يُطبَّق التغيير، نفّذ `/reload`.

## الأنماط

| النمط | السلوك | الرموز |
| --- | --- | --- |
| `auto` (الافتراضي) | تنظيف آمن؛ LLM فقط عند اختيار نموذج | 0 بلا نموذج |
| `safe` | تنظيف حتمي فقط | 0 |
| `llm` | يتطلب نموذجًا، ويعود إلى safe عند الفشل | القليل، من النموذج المختار |

اختر نموذجًا بـ `/refine-model provider/id`. بلا نموذج، حتى `auto` و `llm` يستهلكان 0 رمز.

`context` هو `off` افتراضيًا. `session` يستخدم آخر رسائل الجلسة الحالية، و`recent` يضيف جلسات المشروع الأخيرة. السياق مقتطع ولا يضيف حقائق أبدًا.

## الأوامر

| الأمر | الوصف |
| --- | --- |
| `/refine` | الحالة وفتح اللوحة |
| `/refine-on`, `/refine-off` | تفعيل/تعطيل |
| `/refine-status` | الإعدادات الحالية |
| `/refine-mode <auto\|safe\|llm>` | تغيير النمط |
| `/refine-model [provider/id\|off]` | اختيار النموذج أو إزالته |
| `/refine-models [filter]` | عرض النماذج |
| `/refine-context <off\|session\|recent>` | نطاق السياق |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | معاينة بلا إرسال |
| `/refine-last` | آخر تحسين |
| `/refine-history` | السجل |
| `/refine-stats` | العدادات وتقدير الرموز |
| `/refine-reset` | إعادة ضبط الإعدادات والسجل |
| `/refine-help` | قائمة الأوامر |

ردود الأوامر إشعارات ولا تُشغّل وكيلًا.

## TUI

شارة في تذييل الإدخال: `✦ refine on · auto · none`. اللوحة فيها أربع علامات: Status وLast diff وHistory وStats.

المفاتيح: `1`–`4` للعلامات، `j`/`k` للتمرير، `r` للتحديث، `m` لاختيار نموذج، `t` للتبديل، `Esc` للإغلاق.

## الأمان

- يجب أن تبقى كل الكلمات الأصلية؛ للنموذج إضافة كلمات وظيفية فقط.
- يجب تطابق كل المراسي (شيفرة، URLs، مسارات، أرقام، معرّفات، إشارات) تمامًا.
- حد النمو افتراضيًا 25%.
- أي خطأ أو انتهاء مهلة أو مخرجات غير صالحة → العودة إلى safe ثم إلى النص الأصلي.
- الموجهات ذات الإشارات والإزاحات تُتخطى لحماية المرفقات.
- الخطاف مغلَّف بـ `try/catch`؛ خطأ الإضافة لا يمنع الإرسال أبدًا.

التفاصيل: [docs/SAFETY.md](docs/SAFETY.md).

## الإعدادات

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

كل الخيارات: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## الخصوصية

التحسين محلي. الوضع الآمن لا يرسل شيئًا. مع نموذج مختار، يُرسل نص الموجه وسياق مقتطع اختياري فقط عبر OpenCode إلى المزوّد.

## استكشاف الأخطاء

- **لا شارة ولا أوامر:** `/reload` ثم `opencode plugin list`.
- **لا تغيير:** موجه قصير أو أمر أو غني بالشيفرة أو منظم أصلًا — هذا مقصود.
- **LLM لا يعمل:** اختر نموذجًا بـ `/refine-model`.

## التطوير

```sh
npm install
npm run check
npm pack --dry-run
```

البنية: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## الترخيص

MIT © 2026 ASTRO-CLOU. انظر [LICENSE](LICENSE).
