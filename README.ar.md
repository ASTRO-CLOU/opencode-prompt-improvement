<p align="center">
  <img src="assets/banner.png" alt="opencode-prompt-improvement" width="100%">
</p>

<div align="center">

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)
[![Version](https://img.shields.io/badge/version-0.0.1-emerald.svg)](package.json)

[English](README.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [हिन्दी](README.hi.md) | [Italiano](README.it.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Português](README.pt.md) | [中文](README.zh.md)

</div>

إضافة OpenCode تُحسّن مطالبتك قبل وصولها إلى النموذج. تكتب رسالة قصيرة، فتصل المحادثة إلى نسخة أنظف وأكثر تنظيمًا. النموذج والواجهة يعرضان النص المُعاد كتابته.

**التوافق:** OpenCode V2، تم الاختبار على 2.3.2+ مع واجهة الإضافات 2.4.2. Node.js 22.18+ مطلوب فقط للبناء من المصدر. لا قياس عن بُعد؛ الوضع الحتمي لا يحتاج حسابًا.

## المتطلبات

- OpenCode V2 (2.3.2 أو أحدث).
- Node.js 22.18+ فقط عند البناء من المصدر.
- اختياري: نموذج لمرحلة LLM (llama.cpp/Ollama محلي أو أي مزود في OpenCode).

## التثبيت

التثبيت من GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

نفّذ `/reload` في OpenCode بعد التثبيت. لتثبيت الإصدار: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## الأوامر

كل الأوامر تُجيب عبر الإشعارات ولا تشغّل وكيلًا.

| الأمر | الوصف |
| --- | --- |
| `/imp-status` | عرض الحالة والوضع والنموذج والحصة |
| `/imp-on` / `/imp-off` | تفعيل التحسين أو إيقافه |
| `/imp-models [filter]` | سرد النماذج المتاحة لهذه الإضافة |
| `/imp-model [provider/id#variant]` | اختيار النموذج والنسخة؛ `status` يعرض الحالي |
| `/imp-model off` | الاحتفاظ بالتنظيف وإيقاف استدعاءات النموذج |
| `/imp-force <prompt>` | تحسين مطالبة واحدة مرة واحدة، حتى لو كان التحسين متوقفًا |

`/imp-force` يُعيد إرسال نصك عبر خطاف الطلب بعلامة داخلية. يتجاهل المفتاح وقواعد التخطي، لكنه يحتفظ بكل فحوصات الأمان. العلامة لا تصل إلى النموذج ولا إلى السجل.

## الإعدادات

تحفظ الأوامر الإعدادات لكل جلسة. يمكن أيضًا ضبط خيارات الإضافة بشكل عام:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"],
  "plugin": {
    "opencode-prompt-improvement": {
      "mode": "llm",
      "model": { "providerID": "llamacpp", "id": "qwen3-8b", "variant": "none" },
      "maxGrowth": 0.4,
      "skipCommands": true,
      "skipDetailed": true,
      "detailedThreshold": 2000,
      "llmTimeoutMs": 20000
    }
  }
}
```

| الخيار | الافتراضي | المعنى |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (بدون استدعاءات نموذج) أو `llm` (إعادة كتابة مع بديل) |
| `model` | none | مطلوب لـ `llm`: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | الحد الأقصى لنمو الطول، 0–1 |
| `skipCommands` | `true` | تخطي المطالبات التي تبدأ بـ `/` |
| `skipDetailed` | `true` | تخطي المطالبات الطويلة أو المنظمة بالفعل |
| `detailedThreshold` | `2000` | عدد الأحرف المعتبر طويلًا |
| `llmTimeoutMs` | `20000` | مهلة استدعاء النموذج بالمللي ثانية |

## كيف يعمل

- خطاف `prompt` واحد يعمل عند الاستقبال ويحدّث `text` و `metadata.displayText`، فتعرض المحادثة ما يستلمه النموذج بالضبط.

- التنظيف الحتمي يزيل الأحرف غير المرئية والمسافات والأسطر الفارغة المكررة، ويحافظ على الكود والإشارات والمراسي.

- في وضع `llm` يُستدعى أولًا `ctx.experimental.generate.text`: نصك والتعليمة فقط، دون مطالبة نظام OpenCode. جلسة مؤقتة هي البديل.

- تطلب التعليمة ثلاثة أسطر (`Кто:` / `Задача:` / `Важно:`) و`/no_think` لـ Qwen3. المطالبات التي تحتوي `@إشارات` تتخطى مرحلة LLM.

## الأمان

- يجب الحفاظ على كل مسار ورابط ورقم ومعرّف ومقطع بين علامات الاقتباس الخلفية و`@إشارة`. يُرفض أي جديد.

- يمكن أن يكون الناتج أطول بنسبة 40% كحد أقصى.

- لا تُلمس كتل الكود أبدًا؛ أي تغيير في الكود المضمّن يرفض التعديل كاملًا.

- تُرفض إعادة الكتابة التي تفقد أكثر من 10% من النص الأصلي.

- افتراضيًا تتخطى الإضافة المطالبات الفارغة و`/الأوامر` والبادئة `*` والنصوص الأطول من 2000 حرف. تُعاد حساب مواضع الإشارات، وإلا يبقى النص كما هو.

## حماية الحصة

تُخزَّن إعادة الكتابة الناجحة في الذاكرة المؤقتة: نفس المطالبة والنموذج يعيدان استخدام النتيجة بلا طلب جديد.

خطأ الحد المجاني أو معدل الطلبات يبدأ توقفًا لمدة 6 ساعات؛ أثناء التوقف يعمل التنظيف الحتمي فقط.

`/imp-model off` يحافظ على التنظيف بلا استدعاءات نموذج، و`/imp-off` يعطّل الإضافة بالكامل.

## النماذج المحلية

النموذج المحلي لا يستهلك حصة الحساب. llama.cpp يمنح تحكمًا دقيقًا بالسياق والذاكرة، وOllama تُشغّل بأمر واحد.

### llama.cpp (سياق 16K)

ثبّت الملفات، نزّل `Qwen3-8B-Q4_K_M` (نحو 5 غيغابايت)، وشغّل الخادم المتوافق مع OpenAI. عند انقطاع Hugging Face يُستخدم ModelScope.

```powershell
winget install --id ggml.llamacpp --exact
```

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\opencode\llama\models" | Out-Null
curl.exe -L -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://www.modelscope.cn/api/v1/models/unsloth/Qwen3-8B-GGUF/repo?Revision=master&FilePath=Qwen3-8B-Q4_K_M.gguf"
```

```powershell
& "$env:LOCALAPPDATA\opencode\llama\bin\llama-server.exe" `
  -m "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  -c 16384 -ctk q8_0 -ctv q8_0 -fa on -ngl 99 `
  --port 8080 -a qwen3-8b
```

سجّل الخادم في إعدادات OpenCode العامة مع الإبقاء على مدخل `plugins` الحالي:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "model": "llamacpp/qwen3-8b",
  "providers": {
    "llamacpp": {
      "name": "llama.cpp",
      "package": "@opencode/ai/providers/openai-compatible",
      "settings": { "baseURL": "http://127.0.0.1:8080/v1" },
      "models": {
        "qwen3-8b": {
          "name": "Qwen3 8B (llama.cpp)",
          "modelID": "qwen3-8b",
          "limit": { "context": 16384, "output": 4096 }
        }
      }
    }
  }
}
```

نفّذ `/reload` ثم اختر النموذج في هذه الإضافة:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

ثبّت [Ollama](https://ollama.com)، شغّلها، ثم نزّل نموذجًا. يكتشفها OpenCode تلقائيًا على `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| الخيار | الأفضل لـ | المقابل |
| --- | --- | --- |
| llama.cpp | سياق 16K صريح وضبط الذاكرة | أمر خادم واحد وإعداد واحد |
| Ollama | أسرع تثبيت واكتشاف تلقائي | خيارات أقل منخفضة المستوى |

على بطاقة 8 غيغابايت يكفي سياق 8K–16K. سياق 128K يحتاج ذاكرة أكبر بكثير.

## استكشاف الأخطاء

| العَرَض | الحل |
| --- | --- |
| الإضافة غير موجودة في `opencode plugin list` | أعد التثبيت وتحقق من الوصول إلى GitHub؛ للنسخة الخاصة استخدم رابطًا مصادَقًا. |
| الأوامر تعمل بلا إشعارات | ضع الإضافة في الإعدادات العامة ونفّذ `/reload`. |
| وضع `llm` لا يغيّر شيئًا | تحقق من `/imp-model status`؛ اختر نموذجًا آخر عبر `/imp-models` و`/imp-model مزود/معرف#نسخة`. أزل `@الإشارات`. |
| النموذج المحلي غير موجود في `/imp-models` | أبقِ `llama-server.exe` على المنفذ 8080 أو `ollama serve` يعمل، ثم `/reload`. |
| المحادثة تعرض النص الأصلي | نفّذ `/reload` ليقرأ جزء الخادم الكود الحالي. |

السجلات: `~/.local/share/opencode/log/opencode.log`. لإعادة إنتاج واحدة استخدم `OPENCODE_LOG_LEVEL=DEBUG`.

## التطوير

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` يشغّل الاختبارات وفحص الأنواع وبناء الواجهة. تحتاج الاختبارات إلى Node 22.18+ وتشغّل TypeScript مباشرة عبر `node --test`.

## الترخيص

MIT. انظر [LICENSE](LICENSE).
