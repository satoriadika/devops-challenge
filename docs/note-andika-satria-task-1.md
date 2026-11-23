Task 1

clue 
`We have GuardDuty wired to Slack, but I'm pretty sure some findings never show up in the channel`

check modules/guardduty-2slack
found somethin on events

fix Lambda GuardDuty
try to run 
`node -e "const {buildMessage}=require('./lambda/index');const e=require('./events/s3-anomalous-exfiltration.json');buildMessage(e.detail)"`
and get 
`TypeError: Cannot read properties of undefined (reading 'instanceId')`


explore all repos
i think account usage on dev and prod not separately
live/acme/account.hcl --> there is no dev and prod you can find on vscode type 111111

must separate prod account

prior to deactivated claims-reports-uploader 


recheck repos
found postgres db credential devops-challenge/apps/acme-prod-cluster/values/claims-worker.yaml