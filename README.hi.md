# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | हिन्दी

OpenCode V2 प्लगिन जो प्रॉम्प्ट **भेजे जाने के क्षण** उसमें सुधार करता है। आप छोटा संदेश लिखते हैं; मॉडल को स्वच्छ और बेहतर संरचित संस्करण मिलता है। सुधारित टेक्स्ट सत्र इतिहास में सहेजा जाता है, इसलिए आप देख सकते हैं कि वास्तव में क्या भेजा गया।

प्लगिन कभी तथ्य, आवश्यकताएँ, उदाहरण या शीर्षक नहीं गढ़ता। डिफ़ॉल्ट रूप से यह **मॉडल टोकन बिल्कुल नहीं खर्च करता है**。 आप अंतिम polishing के लिए अलग सस्ता मॉडल चुन सकते हैं; सत्र का मुख्य मॉडल कभी सुधार के लिए उपयोग नहीं होता।

## डेमो

```text
आप लिखते हैं:
  "लॉगिन बग ठीक करो साथ ही टेस्ट जोड़ो और api जाँच लो"

मॉडल को मिलता है:
  - लॉगिन बग ठीक करो
  - टेस्ट जोड़ो
  - api जाँच लो
```

## विशेषताएँ

- रीयल-टाइम प्रॉम्प्ट हुक: मॉडल तक पहुँचने से पहले सुधार।
- डिफ़ॉल्ट रूप से सुरक्षित: बिना मॉडल कॉल के निश्चित सफ़ाई।
- वैकल्पिक LLM polishing केवल स्पष्ट रूप से चुने गए मॉडल के साथ।
- कोई नया तथ्य, आवश्यकता, चरण, उदाहरण, शीर्षक या अनुवाद नहीं।
- कोड, URLs, पथ, संख्याएँ, पहचानकर्ता और `@उल्लेख` सुरक्षित।
- कमांड, बहुत छोटे, कोड-भारी या पहले से संरचित प्रॉम्प्ट छोड़े जाते हैं।
- वर्तमान/हाल के सत्रों का संदर्भ केवल शब्दावली के लिए, तथ्य स्रोत के रूप में कभी नहीं।
- TUI में स्थिति बैज और diff, इतिहास, आँकड़ों वाला पैनल।
- स्लैश कमांड, स्थायी सेटिंग्स और स्थानीय कैश।
- तेज़: सुरक्षित मोड तुरंत; LLM मोड 3.5 सेकंड टाइमआउट और कैश के साथ।

## स्थापना

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

किसी रिलीज़ पर फ़िक्स करें:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

या `opencode.json(c)` में डालें:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

अगर लागू न हो तो `/reload` चलाएँ।

## मोड

| मोड | व्यवहार | टोकन |
| --- | --- | --- |
| `auto` (डिफ़ॉल्ट) | सुरक्षित सफ़ाई; LLM केवल मॉडल चुने जाने पर | बिना मॉडल 0 |
| `safe` | केवल निश्चित सफ़ाई | 0 |
| `llm` | मॉडल आवश्यक, विफलता पर safe पर वापसी | चुने मॉडल के थोड़े टोकन |

`/refine-model provider/id` से मॉडल चुनें। बिना मॉडल `auto` और `llm` भी 0 टोकन खर्च करते हैं।

`context` डिफ़ॉल्ट रूप से `off` है। `session` वर्तमान सत्र के हालिया उपयोगकर्ता संदेश, `recent` उसी प्रोजेक्ट के हालिया सत्र भी जोड़ता है। संदर्भ सीमित है और कभी तथ्य नहीं जोड़ता।

## कमांड

| कमांड | विवरण |
| --- | --- |
| `/refine` | स्थिति और पैनल |
| `/refine-on`, `/refine-off` | सक्षम/अक्षम |
| `/refine-status` | वर्तमान सेटिंग्स |
| `/refine-mode <auto\|safe\|llm>` | मोड बदलें |
| `/refine-model [provider/id\|off]` | मॉडल चुनें/हटाएँ |
| `/refine-models [filter]` | मॉडल सूची |
| `/refine-context <off\|session\|recent>` | संदर्भ का दायरा |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | बिना भेजे पूर्वावलोकन |
| `/refine-last` | अंतिम सुधार |
| `/refine-history` | इतिहास |
| `/refine-stats` | गणना और टोकन अनुमान |
| `/refine-reset` | सेटिंग्स और इतिहास रीसेट |
| `/refine-help` | कमांड सूची |

कमांड उत्तर सूचनाएँ हैं; एजेंट शुरू नहीं करते।

## TUI

इनपुट फ़ुटर में बैज: `✦ refine on · auto · none`। पैनल में चार टैब हैं: Status, Last diff, History, Stats।

कुंजियाँ: `1`–`4` टैब, `j`/`k` स्क्रॉल, `r` रीफ़्रेश, `m` मॉडल चयन, `t` टॉगल, `Esc` बंद करें।

## सुरक्षा

- मूल शब्द सभी बने रहने चाहिए; LLM केवल क्रियात्मक शब्द जोड़ सकता है।
- सभी एंकर (कोड, URL, पथ, संख्या, पहचानकर्ता, उल्लेख) बिलकुल मेल खाने चाहिए।
- डिफ़ॉल्ट वृद्धि सीमा 25% है।
- किसी भी त्रुटि, टाइमआउट या अमान्य आउटपुट पर safe, फिर मूल टेक्स्ट पर वापसी।
- उल्लेख और ऑफ़सेट वाले प्रॉम्प्ट अटैचमेंट बचाने के लिए छोड़े जाते हैं।
- हुक `try/catch` में है: प्लगिन त्रुटि कभी भेजने नहीं रोकती।

पूरा विवरण: [docs/SAFETY.md](docs/SAFETY.md)।

## कॉन्फ़िगरेशन

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

सभी विकल्प: [docs/CONFIGURATION.md](docs/CONFIGURATION.md)।

## गोपनीयता

सुधार स्थानीय है। सुरक्षित मोड कुछ नहीं भेजता। मॉडल चुनने पर केवल प्रॉम्प्ट टेक्स्ट और वैकल्पिक छोटा संदर्भ OpenCode के माध्यम से प्रदाता को जाता है।

## समस्या निवारण

- **बैज या कमांड नहीं:** `/reload`, फिर `opencode plugin list`।
- **कुछ नहीं बदलता:** छोटा प्रॉम्प्ट, कमांड, कोड-भारी या पहले से संरचित — यह इच्छित है।
- **LLM नहीं चलता:** `/refine-model` से मॉडल चुनें।

## विकास

```sh
npm install
npm run check
npm pack --dry-run
```

आर्किटेक्चर: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)।

## लाइसेंस

MIT © 2026 ASTRO-CLOU। [LICENSE](LICENSE) देखें।
