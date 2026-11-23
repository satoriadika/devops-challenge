# Task 04: Getting the platform off one laptop (notes)

Notes only, as the brief allows. No new tool, no code. Based on what is in this repo.

## Today

- `live/` (Terragrunt) and `apps/` (helmfile) are applied from a laptop. Product engineers can also helmfile-apply.
- `ci.yml` checks modules on pull requests (fmt, validate, tests, tflint, checkov) and the Lambda tests.
- `apply.yml` is a manual, unfinished workflow. It uses long-lived AWS keys from repo secrets, runs `run-all apply`
  on everything, and checks out a personal branch (`budi/apply-wip`). I would not turn it on as it is.
- Dev and prod share one AWS account.

## How a change reaches production

1. Pull request. `ci.yml` must pass, and `terragrunt plan` / `helmfile diff` for the changed paths is posted on the PR.
2. Branch protection on `main`: one review, CI green, no direct push (also for product engineers).
   A new `CODEOWNERS` file (there is none today) asks me to review `live/`, `modules/` and `apps/acme-prod-cluster/`.
3. Merge. The workflow applies **dev** automatically. **Prod** waits for a person to approve in a GitHub
   Environment (`prod`, required reviewer), then applies the exact plan that was reviewed.
4. GitHub keeps who opened, who approved, and when it was applied. This is the answer for OJK: change, author, approver, time.
   AWS CloudTrail shows the role that did the apply.

Cluster apps (`apps/`) use the same flow with `helmfile diff` and `helmfile apply`. Moving to ArgoCD can come later.
The docs say we already have it, but we do not.

## AWS access

- **Automation:** GitHub OIDC with one role per environment, no access keys in secrets. The prod role trusts only
  `main` and the `prod` environment. The PR plan job gets a read-only role.
- **Humans:** short-lived logins (SSO) with a read-only role by default. Write access to prod only for me, and only
  through the pipeline. Break-glass role for emergencies, logged and reviewed afterwards.
- Remove the shared `acme` profile on laptops over time.

## What I would not do yet

- **Not ArgoCD or Atlantis now.** One engineer, small budget. GitHub Actions does the job with what we already have.
- **Not a separate AWS account for prod yet.** It is the right goal (risk 7), but it is a big move.
  Do it after the pipeline works, so the pipeline moves with it.
- **Not `run-all apply` on everything.** Apply only the changed units, so one bad change cannot touch all of prod.
- **Not auto-apply to prod.** At least until we trust the plan checks.

## Rollout, without blocking the business

1. **Week 1:** branch protection, `CODEOWNERS`, a PR template with a production checklist (plan read, dev first,
   rollback), a read-only GitHub OIDC role, and `plan` / `diff` posted as PR comments. The plan job only reads, so
   it cannot change anything in AWS. Nothing changes for how people work.
2. **Week 2:** the apply role for **dev**, remove the AWS keys from secrets, and apply **dev** from CI.
3. **Week 3-4:** apply **prod** from CI with approval. Laptop apply is still possible for one more month, as a fallback.
4. **Then:** take away laptop write access to prod, enable the break-glass role, review CloudTrail after the first
   weeks. Tell product engineers early, and keep the old path until the new one has worked a few times.

Risk: the OIDC roles and the prod approval step need an AWS admin and a GitHub org setting. I could not test any of
this without an account.
