---
id: marketplace-plugin-elevenlabs
title: ElevenLabs
---

ToolJet can connect to [ElevenLabs](https://elevenlabs.io), the AI audio platform, to generate speech, transcribe audio, change voices, create sound effects, isolate voices from background noise, and manage voices, models and generation history.

:::info
**NOTE:** **Before following this guide, it is assumed that you have already completed the process of [Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

To connect to an ElevenLabs data source in ToolJet, click the **+ Add new data source** button on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page in the ToolJet dashboard.

ElevenLabs requires the following:

- **API key**: create one under **Developers > API Keys** in the [ElevenLabs dashboard](https://elevenlabs.io/app/developers/api-keys). The key is stored encrypted and sent in the `xi-api-key` header. If you create a restricted key, enable the permissions for the endpoints you plan to use.
- **Region**: the API server to send requests to. Keep **Default** unless your workspace is provisioned for US, EU or India data residency.

Click **Test connection** to verify the key, then **Save**.

## Querying ElevenLabs

1. Click the **+ Add** button in the query manager at the bottom of the editor and select the ElevenLabs data source added earlier.
2. Pick an **Entity** group, then an **Operation**. The list is generated from the [ElevenLabs OpenAPI specification](https://elevenlabs.io/docs/api-reference/introduction) and is searchable by path or summary.
3. Fill in the path, query and request body parameters the operation declares, then click **Run**.

| Entity             | Covers                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Audio              | Text to speech, text to dialogue, speech to speech (voice changer), speech to text, sound effects, audio isolation, forced alignment, music |
| Voices             | List, get, add, edit and delete voices, voice samples, voice design, professional voice cloning                              |
| Account & History  | User and subscription info, models, generation history, workspace management, usage analytics                               |
| Dubbing            | Dubbing projects and their resources                                                                                         |
| Studio             | Studio projects and chapters, pronunciation dictionaries, audio native                                                       |
| Agents             | Agents platform (conversational AI): agents, conversations, knowledge base, tools, phone numbers                              |
| Flows & Assets     | Image, video and speech generations, templates, assets                                                                       |

:::tip
Query results can be transformed using transformations. Refer to our transformations documentation for more details: **[link](/docs/tutorial/transformations)**.
:::

### Filling in body fields

Every body field is a text input. Fields that the API expects as objects or arrays, such as `voice_settings`, can be typed as JSON:

```json
{ "stability": 0.5, "similarity_boost": 0.75 }
```

The plugin reads the operation's schema and converts such values, as well as numbers and booleans, before sending. A `{{ }}` expression that already evaluates to an object also works.

### Uploading audio

Operations that take a file (speech to text, speech to speech, audio isolation, adding a voice) are sent as `multipart/form-data`. The file field accepts any of:

- a **[File Picker](/docs/widgets/file-picker)** file: `{{components.filepicker1.files[0]}}`
- a list of them for fields that take several files, such as `files` when adding a voice: `{{components.filepicker1.files}}`
- a data URL, such as the one exposed by the **Audio Recorder** component: `{{components.audiorecorder1.dataURL}}`
- a plain base64 string

### Audio responses

Operations that return audio, video or archives (text to speech, speech to speech, sound effects, audio isolation, history item audio) return:

```json
{
  "mimeType": "audio/mpeg",
  "base64": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA...",
  "dataUrl": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA...",
  "size": 48527,
  "headers": { "history-item-id": "pV0qYjX8kSf3Lr2NgBzQ", "request-id": "b1c2d3e4f5" }
}
```

To **play** the audio, add an **HTML** component with:

```html
<audio controls src="{{queries.textToSpeech.data.dataUrl}}"></audio>
```

To **download** it, run a **RunJS** query, for example from a button's click event:

```js
const link = document.createElement('a');
link.href = queries.textToSpeech.data.dataUrl;
link.download = 'speech.mp3';
link.click();
```

JSON responses (voices, models, transcripts, history) are returned as-is.

### Errors

Errors returned by ElevenLabs are shown with their HTTP status and message, for example `HTTP 401: invalid_api_key - Invalid API key`, or `HTTP 422: text: Field required` for a missing body field.

## Examples

### Text to speech

**Entity** `Audio`, **Operation** `POST /v1/text-to-speech/{voice_id}`

- Path `voice_id`: a voice id from **List voices**, e.g. `JBFqnCBsd6RMkjVDRZzb`
- Query `output_format`: `mp3_44100_128`
- Body `text`: `{{components.textarea1.value}}`
- Body `model_id`: `eleven_multilingual_v2`

### Speech to text

**Entity** `Audio`, **Operation** `POST /v1/speech-to-text`

- Body `model_id`: `scribe_v2`
- Body `file`: `{{components.filepicker1.files[0]}}`

The transcript is in `{{queries.speechToText.data.text}}`.

### Speech to speech (voice changer)

**Entity** `Audio`, **Operation** `POST /v1/speech-to-speech/{voice_id}`

- Path `voice_id`: the target voice
- Body `audio`: `{{components.audiorecorder1.dataURL}}`
- Body `model_id`: `eleven_multilingual_sts_v2`

### Sound effects

**Entity** `Audio`, **Operation** `POST /v1/sound-generation`

- Body `text`: `Rain on a tin roof with distant thunder`
- Body `duration_seconds`: `5`

### Audio isolation

**Entity** `Audio`, **Operation** `POST /v1/audio-isolation`

- Body `audio`: `{{components.filepicker1.files[0]}}`

### Voices, models and account

| Operation                         | Entity            | Endpoint                                  |
| --------------------------------- | ----------------- | ----------------------------------------- |
| List voices                       | Voices            | `GET /v2/voices`                          |
| Get voice                         | Voices            | `GET /v1/voices/{voice_id}`               |
| List models                       | Account & History | `GET /v1/models`                          |
| List generation history           | Account & History | `GET /v1/history`                         |
| Get history item audio            | Account & History | `GET /v1/history/{history_item_id}/audio` |
| Get user subscription info        | Account & History | `GET /v1/user/subscription`               |
