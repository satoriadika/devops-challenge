# Task 01: Take over the platform (short version)

Based only on what is in this repository. I did not have access to AWS or the cluster, so some risks may be bigger or
smaller in reality. GuardDuty findings below are the sample findings in `modules/guardduty-2slack/events/`.

## 1. Prioritised risks

| # | Risk | Evidence | Why it matters for Acme Insure | Urgency | Effort |
|---|---|---|---|---|---|
| 1 | The keys of `claims-reports-uploader` may be used by someone else | `modules/iam-user/main.tf`: `s3:*` on the bucket, access key that never expires. Sample findings: 18,422 `GetObject` calls on `acme-claims-reports-prod` from an unknown IP (`events/s3-anomalous-exfiltration.json`), then discovery calls from the same IP (`events/iam-anomalous-behavior.json`) | Claim reports hold customer data. A leak is a personal data and OJK problem, and we would not know how much was taken | Now | S |
| 2 | GuardDuty findings for IAM and S3 never reach Slack | `modules/guardduty-2slack/lambda/index.js` reads `finding.resource.instanceDetails.instanceId`. Running it on the two sample findings above throws `TypeError`. Only EC2 findings work. This matches the security team's doubt | The two most serious findings would have been invisible. Nobody can react to an attack they cannot see | Now | S |
| 3 | The database password is in plain text | `DATABASE_URL` in `apps/*/values/claims-worker.yaml` (in git) and visible with `kubectl describe` | Anyone with repo or cluster read access can reach the claims database | This week | M |
| 4 | The docs describe a platform that does not exist | `docs/architecture.md` says ArgoCD, SOPS secrets, PagerDuty alarms and CI apply. The repo has no ArgoCD, no `.sops.yaml`, no PagerDuty, and `apply.yml` is a manual, unfinished workflow. Real flow: laptop `terragrunt` and `helmfile` | I am the only engineer. Wrong docs make me (and the next person) trust controls that are not there | This week | S |
| 5 | Prod worker role is too broad | `claims/prod/claims-worker-iam`: `sqs:*` on `*` (dev is least privilege) | If the worker is compromised, it can read, delete or purge every queue | 30 days | S |
| 6 | Prod runs `latest` and the claims team deploys by pushing to ECR and restarting | `apps/acme-prod-cluster/values/claims-worker.yaml`; `docs/claims-worker.md` | No way to know or roll back to the previous version, and no review of prod changes | 30 days | S |
| 7 | No backups for the claims database, one AWS account for dev and prod | TODO list in `docs/architecture.md` | One mistake or breach can reach prod data. Losing the database means losing every claim | 90 days | L |

Already handled in this PR: the alarm that nobody received (task 02) and the unsafe bucket defaults (task 03).

## 2. What I fix first, and why

I pick risks 1 and 2 because they are small to fix, and they are the ones where an attacker may already be active.

- **Risk 2 (code, next):** make the GuardDuty Lambda accept any finding type (build the message from the fields that exist, no
  `instanceDetails` for IAM and S3), and check that a Slack error fails loudly. Test with the three sample findings.
- **Risk 1 (needs a person):** rotate the keys. First ask who uses `claims-reports-uploader` (I asked Rina in the task 03 reply). Then replace the user
  with a role, disable the old key for a day to see what breaks, then delete it.

**Rollout for prod:** run `terragrunt plan` and `helmfile diff` first and read them. Apply to dev, check, then prod, one change at a time.
Disable a key before deleting it, so it can be turned back on. Revert the commit and apply again to roll back.

## 3. First 90 days

- **Days 1-30:** rotate the reports keys, fix the GuardDuty Lambda, move the database password out of plain text,
  correct the docs, and ask the claims team who deploys what.
- **Days 31-60:** least privilege on the prod worker role, pinned image tags, alarms for crashing pods and the dead-letter
  queue, and alerts to a Slack channel.
- **Days 61-90:** apply from CI with review (see task 04) and a record of who changed prod, backups for the claims
  database (and a restore test), and a plan to separate prod into its own account.
