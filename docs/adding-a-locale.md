# Adding a Locale

## Goal

Add a new UI language without breaking type safety or fallback behavior.

## Steps

1. Create a new folder in `src/i18n/locales/<locale>/`.
2. Copy `src/i18n/locales/en-US/translation.json` into the new locale folder.
3. Translate values and keep the exact same key shape.
4. Register the locale in `src/i18n/index.ts` inside `resources`.
5. Run `npm run check:i18n` to validate key parity with `en-US`.
6. Run `npm run typecheck` and `npm run lint`.

## Fallback behavior

- `en-US` is the source of truth and required fallback.
- If a key is missing at runtime for a non-English locale, i18next falls back to `en-US`.

## RTL note (Arabic)

- Arabic (`ar`) is included as an RTL locale.
- If you need full RTL mirroring for layout behavior, evaluate `I18nManager.forceRTL(true)` during app bootstrap and test on both platforms before enabling globally.

## Migration example

Before:

```tsx
<Text>Open TTS Demo</Text>
<Button label="Speak" onPress={runSpeak} />
```

After:

```tsx
const { t } = useAppTranslation();

<Text>{t('home.open_tts_demo')}</Text>
<Button label={t('tts.speak_button')} onPress={runSpeak} />
```
