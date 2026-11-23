include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${get_repo_root()}/modules//iam-user"
}

dependency "bucket" {
  config_path = "../reports-bucket"
}

inputs = {
  name       = "claims-reports-uploader"
  bucket_arn = dependency.bucket.outputs.bucket_arn

  # Security: GuardDuty shows unusual access to the reports bucket with this key. Turned off, not deleted,
  # so it can be turned back on if something breaks. Delete it after a day if nothing complains.
  # Ask the claims team who uses it before applying (see docs/reply-to-rina-task-3.md, question 5).
  access_key_status = "Inactive"
}
