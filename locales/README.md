# Community locales

Each community locale has two files:

```text
locales/<code>.json
locales/metadata/<code>.json
```

The translation JSON must contain exactly the same keys as `locales/en.json`. Community locale codes are exactly two lowercase ASCII letters (`de`, `fr`, `zh`). Metadata contains only:

```json
{
  "code": "de",
  "nativeName": "Deutsch",
  "flag": "🇩🇪"
}
```

`Auto` is a UI mode, not a locale and not a translation key.

Contributors can use **🌐 Auto → ➕ Add language** inside DSH Plugin Sandbox. The dialog can install a locale locally or submit the validated pair to GitHub.

After a locale is installed locally, reopening **➕ Add language** with the same code reuses the saved translation and metadata. The GitHub submission button can then create the contribution without asking the contributor to paste the JSON again.
