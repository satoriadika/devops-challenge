variable "name" {
  description = "IAM user name."
  type        = string
}

variable "bucket_arn" {
  description = "Bucket the user can access."
  type        = string
}

variable "tags" {
  description = "Extra tags."
  type        = map(string)
  default     = {}
}

variable "access_key_status" {
  description = "Active or Inactive. Set Inactive to turn the key off without deleting it, so it can be turned back on."
  type        = string
  default     = "Active"

  validation {
    condition     = contains(["Active", "Inactive"], var.access_key_status)
    error_message = "access_key_status must be Active or Inactive."
  }
}
