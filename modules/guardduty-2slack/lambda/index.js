'use strict';

const https = require('node:https');

const MIN_SEVERITY = Number(process.env.MIN_SEVERITY || 4);

function severityLabel(severity) {
  if (severity >= 7) return 'HIGH';
  if (severity >= 4) return 'MEDIUM';
  return 'LOW';
}

// Not every finding is about an EC2 instance. Show whatever the finding has.
function describeResource(resource = {}) {
  const parts = [];
  if (resource.instanceDetails?.instanceId) parts.push(`Instance: ${resource.instanceDetails.instanceId}`);
  if (resource.accessKeyDetails?.userName) parts.push(`User: ${resource.accessKeyDetails.userName}`);
  for (const b of resource.s3BucketDetails || []) parts.push(`Bucket: ${b.name}`);
  return parts.length ? parts.join(' | ') : `Resource: ${resource.resourceType || 'unknown'}`;
}

function buildMessage(finding) {

  return {
    text: `:rotating_light: GuardDuty ${severityLabel(finding.severity)}: ${finding.title}`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${finding.title}*\n${finding.description}` },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Type: ${finding.type} | Account: ${finding.accountId} | Region: ${finding.region} | ${describeResource(finding.resource)}`,
          },
        ],
      },
    ],
  };
}

function postToSlack(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      webhookUrl,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`Slack webhook returned HTTP ${res.statusCode}`));
      },
    );
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

exports.handler = async (event) => {
  const finding = event.detail;

  if (finding.severity < MIN_SEVERITY) {
    return;
  }

  await postToSlack(process.env.SLACK_WEBHOOK_URL, buildMessage(finding));
};

exports.buildMessage = buildMessage;
exports.severityLabel = severityLabel;
