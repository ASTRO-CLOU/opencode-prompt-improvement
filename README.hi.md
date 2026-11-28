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

एक OpenCode प्लगिन जो आपके प्रॉम्प्ट को मॉडल तक पहुँचने से पहले बेहतर बनाता है। आप छोटा संदेश लिखते हैं; बातचीत को साफ़ और संरचित संस्करण मिलता है। मॉडल और UI दोनों वही लिखा हुआ टेक्स्ट दिखाते हैं।

**संगतता:** OpenCode V2, 2.3.2+ और plugin API 2.4.2 पर परीक्षण। स्रोत से बनाने के लिए ही Node.js 22.18+ चाहिए। कोई टेलीमेट्री नहीं; deterministic मोड के लिए खाते की आवश्यकता नहीं।

## आवश्यकताएँ

- OpenCode V2 (2.3.2 या नया)।
- केवल स्रोत से बनाने पर Node.js 22.18+।
- वैकल्पिक: LLM चरण के लिए मॉडल (स्थानीय llama.cpp/Ollama या कोई OpenCode प्रदाता)।

## इंस्टॉल

GitHub से इंस्टॉल करें:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

इंस्टॉल के बाद OpenCode में `/reload` चलाएँ। संस्करण फ़िक्स करने के लिए `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1` इस्तेमाल करें।

## कमांड

सभी कमांड सूचनाओं से जवाब देती हैं और कभी एजेंट शुरू नहीं करतीं।

| कमांड | विवरण |
| --- | --- |
| `/imp-status` | स्थिति, मोड, मॉडल और कोटा दिखाएँ |
| `/imp-on` / `/imp-off` | सुधार चालू या बंद करें |
| `/imp-models [filter]` | इस प्लगिन के उपलब्ध मॉडल सूचीबद्ध करें |
| `/imp-model [provider/id#variant]` | मॉडल और वेरिएंट चुनें; `status` वर्तमान दिखाता है |
| `/imp-model off` | सफ़ाई रखें, मॉडल कॉल बंद करें |
| `/imp-force <prompt>` | एक प्रॉम्प्ट को एक बार सुधारें, भले ही सुधार बंद हो |
| `/imp-config [कुंजी मान]` | रनटाइम सेटिंग दिखाएँ या बदलें |

`/imp-config` वर्तमान मान दिखाता है, एक सेटिंग बदलता है, या `reset` से सभी ओवरराइड हटाता है। एक ओवरराइड हटाने के लिए मान `clear` रखें। कुंजियाँ: `mode`, `model`, `maxGrowth`, `skipCommands`, `skipDetailed`, `detailedThreshold`, `llmTimeoutMs`।

`/imp-force` आपके टेक्स्ट को आंतरिक मार्कर के साथ दोबारा prompt hook से भेजता है। यह स्विच और skip नियमों को नज़रअंदाज़ करता है, पर सभी सुरक्षा जाँचें बनाए रखता है। मार्कर मॉडल या इतिहास तक नहीं पहुँचता।

## कॉन्फ़िगरेशन

कमांड सेटिंग्स प्रति सत्र सहेजती हैं। प्लगिन विकल्प वैश्विक रूप से भी सेट किए जा सकते हैं:

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

| विकल्प | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (मॉडल कॉल नहीं) या `llm` (फ़ॉलबैक के साथ पुनर्लेखन) |
| `model` | none | `llm` के लिए आवश्यक: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | आउटपुट लंबाई की अधिकतम वृद्धि, 0–1 |
| `skipCommands` | `true` | `/` से शुरू होने वाले प्रॉम्प्ट छोड़ें |
| `skipDetailed` | `true` | लंबे या पहले से संरचित प्रॉम्प्ट छोड़ें |
| `detailedThreshold` | `2000` | लंबा माने जाने वाले अक्षरों की संख्या |
| `llmTimeoutMs` | `20000` | मॉडल कॉल का टाइमआउट, मिलीसेकंड में |

## काम कैसे करता है

- एक `prompt` hook स्वीकार के समय चलता है और `text` व `metadata.displayText` दोनों अपडेट करता है; बातचीत में वही दिखता है जो मॉडल को मिलता है।

- deterministic सफ़ाई अदृश्य अक्षर, दोहराए गए स्पेस और खाली लाइनें हटाती है, कोड, mentions और anchors सुरक्षित रखती है।

- `llm` मोड में पहले `ctx.experimental.generate.text` कहा जाता है: केवल आपका टेक्स्ट और निर्देश, OpenCode सिस्टम प्रॉम्प्ट के बिना। अस्थायी सत्र फ़ॉलबैक है।

- आंतरिक निर्देश तीन पंक्तियाँ माँगता है, जिनके शीर्षक भाषा के अनुसार बदलते हैं: रूसी इनपुट के लिए `Кто: / Задача: / Важно:`, अन्य भाषाओं के लिए `Who: / Task: / Important:` और Qwen3 के लिए `/no_think`। `@mentions` वाले प्रॉम्प्ट LLM चरण से बचते हैं।

## सुरक्षा

- हर पाथ, URL, संख्या, पहचानकर्ता, backtick टुकड़ा और `@mention` बचना चाहिए; नए अस्वीकृत हैं।

- आउटपुट इनपुट से अधिकतम 40% लंबा हो सकता है।

- कोड ब्लॉक कभी नहीं बदले; inline कोड बदलने पर पूरा बदलाव अस्वीकृत।

- मूल टेक्स्ट का 10% से अधिक खोने वाला पुनर्लेखन अस्वीकृत है।

- डिफ़ॉल्ट रूप से खाली प्रॉम्प्ट, `/commands`, `*` उपसर्ग और 2000 अक्षर से लंबे टेक्स्ट छोड़े जाते हैं। mention ऑफ़सेट दोबारा निकाले जाते हैं, अन्यथा प्रॉम्प्ट अपरिवर्तित रहता है।

## कोटा सुरक्षा

सफल पुनर्लेखन कैश हो जाते हैं: वही प्रॉम्प्ट और मॉडल बिना नए अनुरोध के परिणाम दोबारा इस्तेमाल करते हैं।

मुफ़्त सीमा या दर की गलती 6 घंटे की रोक शुरू करती है; उस दौरान केवल deterministic सफ़ाई चलती है।

`/imp-model off` मॉडल कॉल के बिना सफ़ाई रखता है; `/imp-off` प्लगिन पूरी तर बंद करता है।

## स्थानीय मॉडल

स्थानीय मॉडल खाते के कोटे का उपयोग नहीं करता। llama.cpp संदर्भ और VRAM पर सटीक नियंत्रण देता है; Ollama एक कमांड में चलता है।

### llama.cpp (16K संदर्भ)

बाइनरी इंस्टॉल करें, `Qwen3-8B-Q4_K_M` (~5 GB) डाउनलोड करें और OpenAI-संगत सर्वर शुरू करें। Hugging Face कनेक्शन टूटने पर ModelScope इस्तेमाल होता है।

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

मौजूदा `plugins` एंट्री रखते हुए सर्वर को वैश्विक OpenCode कॉन्फ़िग में दर्ज करें:

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

`/reload` चलाएँ, फिर इस प्लगिन में मॉडल चुनें:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

[Ollama](https://ollama.com) इंस्टॉल करें, चलाएँ और मॉडल खींचें। OpenCode इसे `http://127.0.0.1:11434` पर अपने आप खोज लेता है।

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| विकल्प | के लिए बेहतर | समझौता |
| --- | --- | --- |
| llama.cpp | स्पष्ट 16K संदर्भ और VRAM ट्यूनिंग | एक सर्वर कमांड और एक कॉन्फ़िग एंट्री |
| Ollama | सबसे तेज़ सेटअप और auto-discovery | कम निचले स्तर के विकल्प |

8 GB कार्ड पर 8K–16K संदर्भ पर्याप्त है। 128K के लिए बहुत अधिक VRAM चाहिए।

## समस्या निवारण

| लक्षण | समाधान |
| --- | --- |
| `opencode plugin list` में प्लगिन नहीं है | फिर इंस्टॉल करें और GitHub पहुँच जाँचें; निजी फ़ॉर्क के लिए प्रमाणित URL इस्तेमाल करें। |
| कमांड चलती हैं, सूचनाएँ नहीं | प्लगिन को वैश्विक कॉन्फ़िग में डालें और `/reload` चलाएँ। |
| `llm` मोड कुछ नहीं बदलता | `/imp-model status` देखें; `/imp-models` और `/imp-model provider/id#variant` से दूसरा मॉडल चुनें। `@mentions` हटाएँ। |
| `/imp-models` में स्थानीय मॉडल नहीं | `llama-server.exe` को पोर्ट 8080 पर या `ollama serve` चलाएँ, फिर `/reload`। |
| बातचीत में मूल टेक्स्ट दिखता है | `/reload` चलाएँ ताकि सर्वर भाग वर्तमान कोड ले सके। |

लॉग: `~/.local/share/opencode/log/opencode.log`। एक बार दोहराने के लिए `OPENCODE_LOG_LEVEL=DEBUG` इस्तेमाल करें।

## डेवलपमेंट

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` टेस्ट, टाइप चेक और GUI बिल्ड चलाता है। टेस्ट के लिए Node 22.18+ चाहिए और वे `node --test` से सीधे TypeScript चलाते हैं।

## लाइसेंस

MIT. [LICENSE](LICENSE) देखें।
