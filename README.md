# payload-support

Payload CMS plugin that lets admin users file bug reports and send them to [Shortcut](https://shortcut.com) as stories.

0.5 is a beta: a single provider (Shortcut), a title + Lexical description, and template-based story creation. Screenshots and extra providers can come later.

## Install

```bash
pnpm add payload-support
```

Peer dependencies: `payload` and `@payloadcms/richtext-lexical`.

## Usage

```ts
import { payloadSupportPlugin } from 'payload-support'

export default buildConfig({
  plugins: [
    payloadSupportPlugin({
      enabled: Boolean(process.env.SHORTCUT_TOKEN),
      shortcut: {
        token: process.env.SHORTCUT_TOKEN!,
        storyTemplateId: process.env.SHORTCUT_STORY_TEMPLATE_ID,
        storyType: 'bug',
        // Optional overrides when the template does not already set them:
        // epicId: Number(process.env.SHORTCUT_EPIC_ID),
        // ownerIds: process.env.SHORTCUT_OWNER_IDS?.split(','),
      },
    }),
  ],
  // Required to keep Shortcut workflow state fresh on reports:
  jobs: {
    autoRun: [{ cron: '* * * * *', queue: 'payload-support' }],
  },
})
```

Set these in `.env` (never commit the token):

```
SHORTCUT_TOKEN=
SHORTCUT_STORY_TEMPLATE_ID=66703692-42a0-457d-b9c0-34e04b9a5a07
```

The Shortcut API token is already scoped to a workspace. You do not pass a separate workspace ID.

When `enabled` is `false`, the `support-reports` collection stays in the schema (so migrations remain stable) but is hidden in admin and nothing is sent to Shortcut.

## What it does

1. Adds a **Support Reports** collection to the admin panel.
2. On create, converts the Lexical description to Markdown (so **bold** in Payload stays `**bold**` in Shortcut).
3. Creates a Shortcut story from your story template (`POST /api/v3/stories/from-template`).
4. Stores the Shortcut story ID, URL, and workflow state (name plus its `backlog` / `unstarted` / `started` / `done` type) on the report. The list and edit views colour the state green when it is done and amber while it is started, so open tickets stand out.
5. Registers a scheduled job (`syncSupportReportStates`, every 5 minutes on queue `payload-support`) that refreshes stored Shortcut states for sent reports.

Default access is any authenticated user. Override `access` or lock the collection down with your own RBAC plugin.

### Running the state-sync job

The plugin only **registers** the scheduled task. Something in your app must **queue and run** jobs for the `payload-support` queue:

- Dedicated server: `pnpm payload jobs:run --cron "* * * * *" --queue payload-support --handle-schedules`
- Or `jobs.autoRun` as in the usage example above
- Serverless: call `/api/payload-jobs/run?queue=payload-support` from an external cron (e.g. Vercel Cron)

Without a runner, `externalState` is still set when a report is created, but it will not update when the story moves in Shortcut.

## Development

```bash
cp dev/.env.example dev/.env
pnpm dev
```

Open http://localhost:3000/admin (dev login: `dev@payloadcms.com` / `test`).

Plugin consumers import the compiled `dist/` output. Run `pnpm build` after changing plugin source (also happens automatically via `pnpm dev` and `pnpm test:int`).
