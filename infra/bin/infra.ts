#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AuthSystemStack } from "../lib/auth-system-stack";

const app = new cdk.App();

new AuthSystemStack(app, "AuthSystemStack", {
  description:
    "Auth System - Single EC2 + Docker Compose deployment for testing/demos",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "ap-south-1",
  },
});
