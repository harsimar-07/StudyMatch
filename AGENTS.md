<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## StudyMatch architecture
- Study group reads/writes go through server functions in src/lib/study-groups.functions.ts using the publishable key — keeps all DB access server-side with RLS.
- Group capacity and duplicate-name checks are enforced in the database (trigger + join_study_group function) — so they can't be bypassed from the browser.
- The AI planner calls Lovable AI via streamText + Output.object in src/lib/planner.functions.ts — streamObject hung with the installed AI SDK version.
