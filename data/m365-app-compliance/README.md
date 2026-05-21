# M365 control catalog (JSON export)

Control definitions are authored in [`lib/controls/catalog.ts`](../../lib/controls/catalog.ts).

Regenerate these JSON files after catalog changes:

```bash
npm run export-seeds
```

Outputs:

- `application-security.json` (27 controls)
- `operational-security.json` (30 controls)
- `data-handling.json` (19 controls)
