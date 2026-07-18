### Task 6: App Rename

**Files:**
- Modify: `package.json`
- Modify: `electron-builder.yml`

- [ ] **Step 1: Update `package.json`**

```json
{
  "name": "ai-desktop",
  "version": "1.0.0",
  "description": "AI Desktop Application",
  "author": "AI Desktop",
  ...
}
```

- [ ] **Step 2: Update `electron-builder.yml`**

```yaml
appId: com.local.aidesktop
productName: AI Desktop
copyright: Copyright © 2026
...
nsis:
  ...
  shortcutName: AI Desktop
  ...
  artifactName: AI-Desktop-Setup-${version}.exe
```

- [ ] **Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add package.json electron-builder.yml
git commit -m "chore: rename app to AI Desktop"
```

