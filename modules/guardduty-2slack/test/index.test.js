'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { buildMessage, severityLabel } = require('../lambda/index');
const ec2Finding = require('../events/ec2-ssh-bruteforce.json');

test('severityLabel maps GuardDuty severities', () => {
  assert.strictEqual(severityLabel(8), 'HIGH');
  assert.strictEqual(severityLabel(5), 'MEDIUM');
  assert.strictEqual(severityLabel(2), 'LOW');
});

test('buildMessage includes the finding title and instance', () => {
  const message = buildMessage(ec2Finding.detail);

  assert.match(message.text, /SSH brute force/);
  assert.match(message.blocks[1].elements[0].text, /i-0a1b2c3d4e5f60789/);
});

test('buildMessage works for IAM and S3 findings (no instanceDetails)', () => {
  const iam = buildMessage(require('../events/iam-anomalous-behavior.json').detail);
  assert.match(iam.blocks[1].elements[0].text, /User: claims-reports-uploader/);

  const s3 = buildMessage(require('../events/s3-anomalous-exfiltration.json').detail);
  assert.match(s3.blocks[1].elements[0].text, /Bucket: acme-claims-reports-prod/);
});

test('buildMessage does not throw when resource has nothing known', () => {
  const message = buildMessage({ severity: 5, title: 't', description: 'd', type: 'x', resource: { resourceType: 'Other' } });
  assert.match(message.blocks[1].elements[0].text, /Resource: Other/);
});
